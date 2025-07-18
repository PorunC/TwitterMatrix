import requests
import json

def send_tweet(logger, tweet_text: str, api_key: str, auth_token: str) -> bool:
    url = "https://api.apidance.pro/graphql/CreateTweet"
    
    payload = json.dumps({
        "variables": {
            "tweet_text": tweet_text
        }
    })

    headers = {
        'Content-Type': 'application/json',
        'apikey': api_key,
        'AuthToken': auth_token
    }

    response = requests.post(url, headers=headers, data=payload)
    response.raise_for_status()
    print(f"推文发送成功: {tweet_text[:50]}...")


send_tweet(logger=None, tweet_text="Hello, world!", api_key="xxx", auth_token="xxx")

