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


send_tweet(logger=None, tweet_text="Hello, world!", api_key="zwasta2u8sf627w7dh9hyfdxt7jwzb", auth_token="07e4dfb39c7e8d3cd234bc4117ca18e5e1795333")

