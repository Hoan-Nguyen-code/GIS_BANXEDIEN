import feedparser
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import render
from bs4 import BeautifulSoup


def extract_image(entry):
    if 'summary' in entry:
        soup = BeautifulSoup(entry.summary, 'html.parser')
        img = soup.find('img')
        if img and img.get('src'):
            return img.get('src')

    if 'media_content' in entry:
        return entry.media_content[0].get('url')

    if 'media_thumbnail' in entry:
        return entry.media_thumbnail[0].get('url')

    return None


def clean_html(html):
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text()


@api_view(['GET'])
def get_news(request):
    url = "https://news.google.com/rss/search?q=xe+điện+OR+xăng+dầu&hl=vi&gl=VN&ceid=VN:vi"

    feed = feedparser.parse(url)

    news_list = []

    for entry in feed.entries[:50]:
        image = extract_image(entry)

        news_list.append({
            "title": entry.title,
            "content": clean_html(entry.summary),
            "image": image,
            "link": entry.link,
            "created_at": entry.published
        })

    return Response(news_list)


def news_page(request):
    return render(request, 'news/news.html')