import requests
import json

url = "https://netfree.link/api/tags/value/edit/get"
login_url = 'https://netfree.link/api/user/login-by-password'

USER_PASSWORD = "88069067"
USERNAME = "+972583230207"

login_data = {
    'password': USER_PASSWORD,
    'phone': USERNAME
}
payload = json.dumps({
  "host": "youtube.com"
})
headers = {
  'authority': 'netfree.link',
  'accept': 'application/json, text/plain, */*',
  'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
  'content-type': 'application/json',
  'origin': 'https://netfree.link',
  'referer': 'https://netfree.link/app/',
  'save-data': 'on',
  'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
}

session = requests.Session()
login_response = session.post(login_url, headers=headers, json=login_data)
cookie = login_response.cookies.get_dict()
headers['cookie'] = '; '.join([f"{name}={value}" for name, value in cookie.items()])
tags_response = session.post(url, headers=headers, data=payload)
print(tags_response.json())
# print(response.json())
