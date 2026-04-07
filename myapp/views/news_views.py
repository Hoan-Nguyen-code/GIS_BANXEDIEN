import feedparser
import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import render
from bs4 import BeautifulSoup
from rest_framework import status

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

    try:
        feed = feedparser.parse(url)

        if feed.bozo:
            return Response(
                {"error": "RSS parse error"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        if not feed.entries:
            return Response(
                {"error": "No data"},
                status=status.HTTP_204_NO_CONTENT
            )

        news_list = []

        for entry in feed.entries[:50]:
            news_list.append({
                "title": getattr(entry, "title", ""),
                "content": clean_html(getattr(entry, "summary", "")),
                "image": extract_image(entry),
                "link": getattr(entry, "link", ""),
                "created_at": getattr(entry, "published", "")
            })

        return Response(news_list, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def news_page(request):
    try:
        response = requests.get("http://127.0.0.1:8000/api/news/", timeout=5)

        if response.status_code != 200:
            return render(
                request,
                f"errors/{response.status_code}.html",
                status=response.status_code
            )

        data = response.json()
        return render(request, 'news/news.html', {"news": data})

    except requests.exceptions.Timeout:
        return render(request, 'errors/504.html', status=504)

    except requests.exceptions.ConnectionError:
        return render(request, 'errors/503.html', status=503)

    except requests.exceptions.RequestException:
        return render(request, 'errors/500.html', status=500)