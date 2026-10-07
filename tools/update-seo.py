#!/usr/bin/env python3
"""Update static Vien.noir event pages and SEO metadata. No server/build needed online.

Sources of dates and ticket URLs: the three German/English show pages.
Usage: python tools/update-seo.py --date YYYY-MM-DD
Dependencies: beautifulsoup4 and (on Windows) tzdata.
Existing generated event pages are retained as archives, never silently deleted.
"""
from __future__ import annotations
import argparse
import copy
from datetime import date, datetime
from html import escape
import json
from pathlib import Path
import posixpath
import re
from urllib.parse import urljoin, urlsplit, unquote
from zoneinfo import ZoneInfo
import xml.etree.ElementTree as ET
try:
    from bs4 import BeautifulSoup
except ImportError:
    raise SystemExit('Install dependencies: python -m pip install -r tools/requirements-seo.txt')

ROOT = Path(__file__).resolve().parent.parent
BASE = 'https://viennoir.com'
TZ = ZoneInfo('Europe/Vienna')
SHOWS = {
    'ladies-of-bond-vienna': {'name': 'Ladies of Bond', 'kind': 'bond'},
    'season-of-desire-vienna': {'name': 'Season of Desire', 'kind': 'desire'},
    'santa-baby-dinner-show': {'name': 'Santa Baby', 'kind': 'santa'},
}
# Only use confirmed values. Per-date data-start-time / data-door-time attributes
# on the German date-row override these defaults for individual performances.
DEFAULT_START = '19:30'
DEFAULT_DOORS = '18:30'
VENUE = {'@type': 'Place', 'name': 'Das Vindobona', 'url': 'https://vindobona.wien/',
         'address': {'@type': 'PostalAddress', 'streetAddress': 'Wallensteinplatz 6',
                     'postalCode': '1200', 'addressLocality': 'Wien', 'addressCountry': 'AT'}}
MONTHS = {
    'de': ['', 'J\u00e4nner', 'Februar', 'M\u00e4rz', 'April', 'Mai', 'Juni', 'Juli',
           'August', 'September', 'Oktober', 'November', 'Dezember'],
    'en': ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July',
           'August', 'September', 'October', 'November', 'December']}
DAYS = {'de': ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
        'en': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']}
LABELS = {
    'de': {'home':'Startseite', 'programme':'Programm', 'date':'Termin',
           'past':'Vergangen', 'details':'Termindetails', 'doors':'Einlass', 'start':'Beginn',
           'meal':'Vorspeise', 'venue':'Spielort', 'city':'Wien', 'back':'Zur Show',
           'ticket':'Tickets buchen', 'when':'Datum', 'info':'Ihr Abend im Vindobona.',
           'all':'Alle Termine', 'directions':'Anfahrt zum Vindobona',
           'price':'Preise, Sitzplatzkategorien und aktuelle Verf\u00fcgbarkeit finden Sie beim Ticketanbieter.',
           'archive':'Dieser Termin liegt in der Vergangenheit. Weitere Termine finden Sie auf der Showseite.',
           'local':'Alle Uhrzeiten sind Ortszeit Wien.', 'kicker':'Vorstellung im Vindobona'},
    'en': {'home':'Home', 'programme':'Programme', 'date':'Date',
           'past':'Past event', 'details':'Event details', 'doors':'Doors', 'start':'Show',
           'meal':'Starter', 'venue':'Venue', 'city':'Vienna', 'back':'About the show',
           'ticket':'Book tickets', 'when':'Date', 'info':'Your evening at the Vindobona.',
           'all':'All dates', 'directions':'Directions to the Vindobona',
           'price':'See the ticket provider for prices, seating categories and current availability.',
           'archive':'This date is in the past. Visit the show page for further dates.',
           'local':'All times are local time in Vienna.', 'kicker':'Live at Das Vindobona'}
}
S = 'http://www.sitemaps.org/schemas/sitemap/0.9'
X = 'http://www.w3.org/1999/xhtml'
I = 'http://www.google.com/schemas/sitemap-image/1.1'
ET.register_namespace('', S); ET.register_namespace('xhtml', X); ET.register_namespace('image', I)


def soup(text):
    # Normalize void LINK elements before parsing mixed HTML/XHTML source.
    # This also prevents the parser nesting later metadata under a LINK tag.
    text=re.sub(r'</link\s*>','',text,flags=re.I)
    text=re.sub(r'<link\b[^>]*>',lambda m:m[0][:-1].rstrip().rstrip('/')+'/>',text,flags=re.I)
    return BeautifulSoup(text, 'html.parser')


def dump(data):
    return json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')


def page_url(path):
    p = path.relative_to(ROOT).as_posix()
    return BASE + '/' + (p[:-10] if p.endswith('index.html') else p)


def rel(url, current):
    target = urlsplit(urljoin(current, url))
    if target.netloc and target.netloc != urlsplit(BASE).netloc:
        return url
    current_dir = urlsplit(current).path
    value = posixpath.relpath(target.path or '/', current_dir)
    if target.path.endswith('/'):
        value = './' if value == '.' else value.rstrip('/') + '/'
    if target.query: value += '?' + target.query
    if target.fragment: value += '#' + target.fragment
    return value


def date_label(day, lang, weekday=False):
    d = date.fromisoformat(day)
    label = f'{d.day}{"." if lang == "de" else ""} {MONTHS[lang][d.month]} {d.year}'
    return (DAYS[lang][d.weekday()] + ', ' if weekday else '') + label


def stamp(day, clock):
    if not re.fullmatch(r'(?:[01]\d|2[0-3]):[0-5]\d', clock):
        raise ValueError(f'Invalid start time {clock!r} for {day}')
    return datetime.fromisoformat(day + 'T' + clock + ':00').replace(tzinfo=TZ).isoformat()


def set_meta(head, key, value, prop=False):
    attr = 'property' if prop else 'name'
    node = head.find('meta', attrs={attr:key})
    if node is None:
        node = soup('<meta>').meta; node[attr] = key; head.append(node)
    node['content'] = value


def graph_of(head):
    for node in head.find_all('script', type='application/ld+json'):
        data = json.loads(node.string or node.get_text())
        if isinstance(data, dict) and '@graph' in data:
            return data, node
    raise ValueError('Missing base JSON-LD graph')


def put_graph(head, graph, node=None):
    if node is None:
        node = soup('<script type="application/ld+json"></script>').script
        head.append(node)
    node.string = dump(graph)


def get_page(graph):
    return next(x for x in graph['@graph'] if x.get('@type') in
                ('WebPage', 'AboutPage', 'ContactPage', 'CollectionPage'))


def breadcrumb(items, url):
    return {'@type':'BreadcrumbList', '@id':url+'#breadcrumb', 'itemListElement':[
        {'@type':'ListItem', 'position':i+1, 'name':name, 'item':link}
        for i,(name,link) in enumerate(items)]}


def head_replace(text, head):
    return re.sub(r'<head\b[^>]*>.*?</head>', lambda _: str(head), text, count=1, flags=re.S|re.I)


def add_assets(text, url):
    head = soup(re.search(r'<head\b[^>]*>.*?</head>', text, re.S|re.I)[0]).head
    css = rel(BASE+'/assets/css/event-seo.css?v=20261007-1', url)
    if not head.find('link', href=re.compile(r'event-seo\.css')):
        tag=soup('<link rel="stylesheet">').link; tag['href']=css; head.append(tag)
    text = head_replace(text,head)
    if 'assets/js/event-dates.js' not in text:
        src=rel(BASE+'/assets/js/event-dates.js?v=20261007-1',url)
        text=text.replace('</body>', f'<script defer src="{src}"></script>\n</body>')
    return text


def read_dates(path):
    doc=soup(path.read_text(encoding='utf-8'))
    values=[]
    for row in doc.select('.date-row'):
        time=row.select_one('.date-row__date time[datetime]')
        if time is None: raise ValueError(f'Missing date in {path}')
        day=time['datetime'][:10]; date.fromisoformat(day)
        ticket=row.find('a', href=re.compile(r'^https://vindobona\.wien/events/'))
        ticket_url=ticket['href'] if ticket else row.get('data-ticket-url')
        if not ticket_url: raise ValueError(f'Missing ticket URL for {path}: {day}')
        if urlsplit(ticket_url).scheme != 'https': raise ValueError('Ticket URL must be HTTPS')
        values.append({'date':day, 'ticket':ticket_url,
                       'start':row.get('data-start-time',DEFAULT_START),
                       'doors':row.get('data-door-time',DEFAULT_DOORS)})
    if len({x['date'] for x in values}) != len(values): raise ValueError(f'Duplicate dates in {path}')
    return values


def rewrite_rows(text, events, lang, url, asof, programme=False):
    # Only rewrite individual date rows; the remaining source, forms and scripts stay intact.
    if programme:
        pattern=r'<article\b[^>]*class="[^"]*program-row[^\"]*"[^>]*>.*?</article>'
    else:
        pattern=r'<div\b[^>]*class="date-row(?: [^\"]*)?"[^>]*>.*?</(?:a|span)>\s*</div>'
    def change(match):
        doc=soup(match[0]); row=doc.find('article' if programme else 'div')
        date_node=row.select_one('.program-row__date time[datetime]' if programme else '.date-row__date time[datetime]')
        if date_node is None: return match[0]
        day=date_node['datetime'][:10]
        if programme:
            show_link=row.select_one('.program-row__show a[href]')
            slug=next((k for k in SHOWS if k in show_link.get('href','')),None) if show_link else None
            event=events.get((slug,day))
        else:
            slug=next(k for k in SHOWS if '/'+k+'/' in url)
            event=events.get((slug,day))
        if event is None: return match[0]
        start=stamp(day,event['start']); past=day<asof
        row['data-event-start-at']=start
        row['data-start-time']=event['start']; row['data-door-time']=event['doors']
        row['data-ticket-url']=event['ticket']
        label=LABELS[lang]
        # Dates become crawlable links. Ticket buttons continue to open the provider directly.
        detail=BASE+('/en/' if lang=='en' else '/')+slug+'/'+day+'/'
        exists=(ROOT/urlsplit(detail).path.lstrip('/')/'index.html').exists()
        if not past or exists:
            if date_node.parent.name=='a':
                link=date_node.parent
            else:
                link=doc.new_tag('a'); date_node.wrap(link)
            link['href']=rel(detail,url); link['class']='event-date-link'
            link['title']=label['details']+' \u2013 '+SHOWS[slug]['name']
        # Mark only the expired date, not the entire production, as past.
        button=row.select_one('.button')
        if button:
            if past:
                button.name='span'; button.attrs={'class':['button','event-past']}
                button.string=label['past']
            else:
                button.name='a'; button['href']=event['ticket']; button['target']='_blank'
                button['rel']='noopener'; button['class']=['button']; button['data-event-ticket']=''
                button.string='Tickets'
        if slug=='santa-baby-dinner-show':
            t=row.select_one('.program-row__time' if programme else '.date-row__time')
            if t:
                t.clear()
                clock=(f'{event["doors"]} {label["doors"]} \u00b7 19:00 {label["meal"]}<br/>'
                       f'<time data-event-start="" datetime="{event["start"]}">{event["start"]}</time> {label["start"]}<br/>Das Vindobona')
                for c in list(soup(clock).contents): t.append(c)
        return str(row)
    if programme:
        return re.sub(pattern,change,text,flags=re.S)
    # Date rows contain nested DIVs and, after the first run, an internal date
    # link. Match the complete balanced DIV instead of stopping at that link.
    starts=list(re.finditer(r'<div\b[^>]*class="date-row(?: [^\"]*)?"[^>]*>',text))
    for begin in reversed(starts):
        depth=0
        end=None
        for token in re.finditer(r'</?div\b[^>]*>',text[begin.start():],re.I):
            depth += -1 if token[0].lower().startswith('</') else 1
            if depth==0:
                end=begin.start()+token.end()
                break
        if end is None:
            raise ValueError('Unbalanced date-row markup')
        fragment=text[begin.start():end]
        # change() only requires match[0].
        text=text[:begin.start()]+change([fragment])+text[end:]
    return text


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--date',default=datetime.now(TZ).date().isoformat(),help='Actual modification date, YYYY-MM-DD')
    args=parser.parse_args(); asof=date.fromisoformat(args.date).isoformat()
    before={p:p.read_bytes() for p in ROOT.rglob('*') if p.is_file()}
    # Match the configured GitHub Pages host, not a URL which redirects to it.
    host=(ROOT/'CNAME').read_text().strip()
    if host!='viennoir.com': raise ValueError('CNAME changed: review BASE before running this script.')
    for p in ROOT.rglob('*'):
        if p.is_file() and p.suffix in ('.html','.xml','.txt') and 'tools' not in p.parts:
            t=p.read_text(encoding='utf-8'); n=t.replace('https://www.viennoir.com','https://viennoir.com')
            if n!=t:p.write_text(n,encoding='utf-8')
    events={}
    for slug in SHOWS:
        de=read_dates(ROOT/slug/'index.html'); en=read_dates(ROOT/'en'/slug/'index.html')
        if [(x['date'],x['ticket']) for x in de]!=[(x['date'],x['ticket']) for x in en]:
            raise ValueError(f'German/English dates or ticket links differ: {slug}')
        for event in de:
            stamp(event['date'],event['start']); stamp(event['date'],event['doors'])
            events[(slug,event['date'])]=event
    for path in sorted(ROOT.rglob('*.html')):
        text=path.read_text(encoding='utf-8')
        if 'name="viennoir-generated"' in text or 'name=\'viennoir-generated\'' in text: continue
        doc=soup(text)
        if doc.find('meta',attrs={'http-equiv':re.compile('refresh',re.I)}) or not doc.find('link',rel='canonical'):continue
        url=page_url(path); lang='en' if '/en/' in url else 'de'; labels=LABELS[lang]
        head=doc.head; graph,node=graph_of(head); page=get_page(graph)
        page['description']=head.find('meta',attrs={'name':'description'})['content']
        page['name']=head.title.get_text()
        graph['@graph']=[x for x in graph['@graph'] if x.get('@type')!='BreadcrumbList']
        homepage=BASE+('/en/' if lang=='en' else '/')
        slug=next((k for k in SHOWS if url.endswith('/'+k+'/')),None)
        if url!=homepage:
            items=[(labels['home'],homepage)]
            if slug:items.append((labels['programme'],BASE+('/en/programme/' if lang=='en' else '/programm/')))
            name=SHOWS[slug]['name'] if slug else head.title.get_text().split('|')[0].strip()
            items.append((name,url)); crumb=breadcrumb(items,url)
            graph['@graph'].append(crumb);page['breadcrumb']={'@id':crumb['@id']}
        # The overview describes a list, not several rich-result events on one URL.
        if slug:
            listing={'@type':'ItemList','@id':url+'#performances','name':labels['all']+' \u2013 '+SHOWS[slug]['name'],
                     'itemListElement':[]}
            for (key,day),ev in events.items():
                if key!=slug or day<asof: continue
                listing['itemListElement'].append({'@type':'ListItem','position':len(listing['itemListElement'])+1,
                    'name':SHOWS[slug]['name']+' \u2013 '+date_label(day,lang),
                    'url':url+day+'/'})
            graph['@graph']=[x for x in graph['@graph'] if x.get('@id')!=listing['@id']]
            graph['@graph'].append(listing);page['mainEntity']={'@id':listing['@id']}
        put_graph(head,graph,node);text=head_replace(text,head)
        if slug:
            text=text.replace('<div class="date-list">','<div class="date-list" id="termine">')
            text=rewrite_rows(text,events,lang,url,asof)
            # The general CTA opens the date list instead of an eventually expired first ticket URL.
            text=re.sub(r'(<section class="section show-cta">.*?)(<a\b[^>]*href="https://vindobona\.wien/events/[^\"]*"[^>]*>)',
                lambda m:m[1]+'<a class="button button--gold" href="#termine">',text,count=1,flags=re.S)
            text=add_assets(text,url)
        if url.endswith('/programm/') or url.endswith('/programme/'):
            text=rewrite_rows(text,events,lang,url,asof,programme=True)
            text=add_assets(text,url)
        if url==homepage:
            # Preserve working native autoplay. No speculative delay/lazy-loading of the hero video.
            old='https://vindobona.wien/events/ladies-of-bond'
            target=rel(BASE+('/en/' if lang=='en' else '/')+'ladies-of-bond-vienna/#termine',url)
            text=re.sub(r'<a\b[^>]*href="'+re.escape(old)+r'"[^>]*>',
                        lambda m: re.sub(r'\s(?:target|rel)="[^\"]*"','',m[0].replace(old,target)),text)
        path.write_text(text,encoding='utf-8')
    # Create/rebuild dedicated event pages. Existing past pages are kept as useful archives.
    generated=[]
    for (slug,day),event in events.items():
        for lang in ('de','en'):
            prefix='/en/' if lang=='en' else '/'; showurl=BASE+prefix+slug+'/'
            url=showurl+day+'/'; path=ROOT/prefix.lstrip('/')/slug/day/'index.html'
            if day<asof and not path.exists():continue
            source=(ROOT/prefix.lstrip('/')/slug/'index.html').read_text(encoding='utf-8')
            doc=soup(source); head=doc.head; labels=LABELS[lang]; show=SHOWS[slug]
            basegraph,_=graph_of(head)
            organization=copy.deepcopy(next(x for x in basegraph['@graph'] if x.get('@type')=='PerformingGroup'))
            website=copy.deepcopy(next(x for x in basegraph['@graph'] if x.get('@type')=='WebSite'))
            for n in list(head.find_all('script',type='application/ld+json')):n.decompose()
            for n in list(head.find_all('style',id=re.compile('faq'))):n.decompose()
            daytext=date_label(day,lang); longdate=date_label(day,lang,True)
            title=f'{show["name"]} \u2013 {daytext} | Vien.noir'
            description=(f'{show["name"]} am {daytext} im Vindobona, Wien. Einlass {event["doors"]}, Beginn {event["start"]}. Termine und Ticketinformationen.'
                if lang=='de' else f'{show["name"]} on {daytext} at Das Vindobona, Vienna. Doors {event["doors"]}, show {event["start"]}. Date and ticket information.')
            head.title.string=title
            for k,v in [('description',description),('twitter:title',title),('twitter:description',description),('viennoir-generated','event-detail')]:set_meta(head,k,v)
            for k,v in [('og:title',title),('og:description',description),('og:url',url)]:set_meta(head,k,v,True)
            head.find('link',rel='canonical')['href']=url
            for link in head.find_all('link',hreflang=True):
                link['href']=BASE+('/en/' if link['hreflang']=='en' else '/')+slug+'/'+day+'/'
            image=doc.select_one('.page-hero__media img')
            image_url=urljoin(showurl,image['src'])
            start=stamp(day,event['start']); doors=stamp(day,event['doors']); past=day<asof
            programme=BASE+('/en/programme/' if lang=='en' else '/programm/')
            homepage=BASE+('/en/' if lang=='en' else '/')
            items=[(labels['home'],homepage),(labels['programme'],programme),(show['name'],showurl),(daytext,url)]
            crumb=breadcrumb(items,url)
            perf={'@type':'TheaterEvent','@id':url+'#event','name':show['name'],
                  'url':url,'startDate':start,'doorTime':doors,
                  'eventStatus':'https://schema.org/EventScheduled',
                  'eventAttendanceMode':'https://schema.org/OfflineEventAttendanceMode',
                  'location':copy.deepcopy(VENUE),'image':[image_url],
                  'description':doc.find('meta',attrs={'name':'description'})['content'],
                  'organizer':{'@type':'PerformingGroup','name':organization['name'],'url':BASE+'/'},
                  'performer':{'@type':'PerformingGroup','name':organization['name'],'url':BASE+'/'}}
            if not past:
                # No invented price, seat availability, end time or sale-start date.
                perf['offers']={'@type':'Offer','url':event['ticket']}
            webpage={'@type':'WebPage','@id':url+'#webpage','url':url,'name':title,'description':description,
                     'inLanguage':'de-AT' if lang=='de' else 'en','isPartOf':{'@id':BASE+'/#website'},
                     'breadcrumb':{'@id':crumb['@id']},'mainEntity':{'@id':perf['@id']},
                     'primaryImageOfPage':{'@type':'ImageObject','url':image_url,'caption':image.get('alt','')}}
            put_graph(head,{'@context':'https://schema.org','@graph':[organization,website,webpage,crumb,perf]})
            template=head_replace(source,head)
            # Rebase only local HTML URL attributes. Absolute schema URLs remain canonical.
            def rebase(m):
                value=m[3]
                if value.startswith(('#','https:','http:','mailto:','tel:','data:','//')):return m[0]
                target=urljoin(showurl,value)
                return m[1]+m[2]+escape(rel(target,url),quote=True)+m[2]
            template=re.sub(r'(\b(?:href|src|poster|action)\s*=\s*)([\"\'])(.*?)(\2)',rebase,template)
            h1=''.join(str(x) for x in doc.select_one('.page-hero h1').contents)
            intro=doc.select_one('.show-copy')
            story=''.join(str(x) for x in intro.find_all('p',class_=['lead','copy'],recursive=False))
            heading=intro.h2.get_text(' ',strip=True)
            crumbs=' <span aria-hidden="true">/</span> '.join(
                f'<a href="{escape(rel(link,url))}">{escape(name)}</a>' if i<3 else f'<span aria-current="page">{escape(name)}</span>'
                for i,(name,link) in enumerate(items))
            meal=(f'<span>{labels["meal"]} 19:00</span>' if show['kind']=='santa' else '')
            ticket=(f'<span class="button event-past">{labels["past"]}</span>' if past else
                    f'<a class="button button--gold" data-event-ticket href="{escape(event["ticket"])}" target="_blank" rel="noopener">{labels["ticket"]}</a>')
            address=f'Wallensteinplatz 6<br/>1200 {labels["city"]}, '+('Austria' if lang=='en' else '\u00d6sterreich')
            details=(f'<dt>{labels["when"]}</dt><dd><time datetime="{day}">{longdate}</time></dd>'
                     f'<dt>{labels["doors"]}</dt><dd>{event["doors"]}</dd>'+
                     (f'<dt>{labels["meal"]}</dt><dd>19:00</dd>' if show['kind']=='santa' else '')+
                     f'<dt>{labels["start"]}</dt><dd><time datetime="{start}">{event["start"]}</time></dd>'
                     f'<dt>{labels["venue"]}</dt><dd>Das Vindobona<br/>{address}</dd>')
            main_html=f'''<main id="main" data-event-start-at="{start}">
<section class="page-hero event-detail-hero">
<div class="page-hero__media"><img src="{rel(image_url,url)}" alt="{escape(image.get('alt',''),quote=True)}" width="1600" height="900" loading="eager" fetchpriority="high" decoding="async"/></div>
<div class="shell page-hero__content"><p class="kicker kicker--plain">{labels['kicker']}</p>
<h1>{h1}</h1><p class="page-hero__lede"><time datetime="{start}">{longdate}</time></p>
<div class="page-hero__meta"><span>{labels['doors']} {event['doors']}</span>{meal}<span>{labels['start']} {event['start']}</span><span>Das Vindobona \u00b7 {labels['city']}</span></div>
<div class="button-row event-detail-actions">{ticket}<a class="button" href="../#termine">{labels['back']}</a></div>
<p class="copy event-archive-note" data-event-archive-note{'' if past else ' hidden'}>{labels['archive']}</p>
</div></section>
<section class="section section--compact"><div class="shell">
<nav class="event-breadcrumb" aria-label="Breadcrumb">{crumbs}</nav>
<div class="event-details-grid"><article class="event-story"><p class="kicker">Vien.noir</p><h2>{escape(heading)}</h2>{story}
<div class="button-row"><a class="button" href="../">{labels['back']}</a><a class="button" href="{rel(programme,url)}">{labels['all']}</a></div></article>
<aside class="event-facts" aria-labelledby="event-facts-heading"><h2 id="event-facts-heading">{labels['info']}</h2><dl>{details}</dl>
<p class="copy">{labels['local']}</p><p class="copy">{labels['price']}</p>
<a class="text-link" href="https://vindobona.wien/kontakt/anfahrt" rel="noopener" target="_blank">{labels['directions']}</a>
</aside></div></div></section></main>'''
            template=re.sub(r'<main\b[^>]*>.*?</main>',lambda _:main_html,template,count=1,flags=re.S)
            # Language switch remains on this exact performance, not the general show page.
            def language_link(m):
                tag=soup(m[0]).a; language=tag['data-language-link']
                tag['href']=rel(BASE+('/en/' if language=='en' else '/')+slug+'/'+day+'/',url)
                return str(tag)
            template=re.sub(r'<a\b[^>]*data-language-link="(?:de|en)"[^>]*>.*?</a>',language_link,template,flags=re.S)
            # The parent show link is no longer the current leaf page.
            template=re.sub(r'(<nav\b[^>]*class="main-nav"[^>]*>)(.*?)(</nav>)',
                lambda m:m[1]+m[2].replace(' aria-current="page"','')+m[3],template,flags=re.S)
            template=add_assets(template,url)
            path.parent.mkdir(parents=True,exist_ok=True);path.write_text(template,encoding='utf-8');generated.append(url)
    # Build a canonical-only sitemap; retain actual lastmod for unchanged files.
    old={}
    if (ROOT/'sitemap.xml').exists():
        tree=ET.parse(ROOT/'sitemap.xml')
        for u in tree.getroot().findall('{'+S+'}url'):
            old[u.findtext('{'+S+'}loc')]=u.findtext('{'+S+'}lastmod')
    xml=ET.Element('{'+S+'}urlset'); count=0
    for p in sorted(ROOT.rglob('*.html')):
        text=p.read_text(encoding='utf-8'); doc=soup(text)
        canonical=doc.find('link',rel='canonical');robots=doc.find('meta',attrs={'name':'robots'})
        if not canonical or (robots and 'noindex' in robots.get('content','')) or doc.find('meta',attrs={'http-equiv':re.compile('refresh',re.I)}):continue
        url=canonical['href']
        if url!=page_url(p):raise ValueError(f'Non-self canonical on {p}: {url}')
        u=ET.SubElement(xml,'{'+S+'}url');ET.SubElement(u,'{'+S+'}loc').text=url
        modified=before.get(p)!=p.read_bytes()
        lastmod=asof if modified or url not in old else old[url]
        if lastmod:ET.SubElement(u,'{'+S+'}lastmod').text=lastmod
        for a in doc.find_all('link',hreflang=True):
            ET.SubElement(u,'{'+X+'}link',{'rel':'alternate','hreflang':a['hreflang'],'href':a['href']})
        image=doc.select_one('.page-hero__media img')
        if image:
            im=ET.SubElement(u,'{'+I+'}image');ET.SubElement(im,'{'+I+'}loc').text=urljoin(url,image['src'])
        count+=1
    ET.indent(xml,space='  ')
    (ROOT/'sitemap.xml').write_bytes(ET.tostring(xml,encoding='utf-8',xml_declaration=True)+b'\n')
    (ROOT/'robots.txt').write_text('# Vien.noir - static website\nUser-agent: *\nDisallow:\n\nSitemap: '+BASE+'/sitemap.xml\n',encoding='utf-8')
    (ROOT/'.nojekyll').touch()
    changes=[str(p.relative_to(ROOT)) for p in ROOT.rglob('*') if p.is_file() and before.get(p)!=p.read_bytes()]
    print(json.dumps({'date':asof,'generated_event_pages':len(generated),'sitemap_urls':count,'changed_files':len(changes)},indent=2))

if __name__=='__main__':
    main()
