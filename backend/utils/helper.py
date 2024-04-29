import imaplib
import json
import os
import random
import re
import string
import time

import requests
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def send_email_with_template(subject, to_email, template_name, context):
    # Render the HTML template to a string
    html_content = render_to_string(template_name, context)
    # Create the email message
    send_mail(
        subject=subject,
        message=strip_tags(html_content),
        from_email=f'ועד שמרם - ראחמיסטריווקא <{settings.EMAIL_HOST_USER}>',
        recipient_list=[to_email],
        html_message=context.get("your_string"),
        fail_silently=True
    )


def capture_error(error):
    exc_type, exc_obj, exc_tb = error[0], error[1], error[2]
    fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
    error_message = f"Error: Start:\n{exc_obj}\nType: {exc_type}\nFile: {fname}\nLine: {exc_tb.tb_lineno}\nEnd here\n"
    return error_message
def generate_unique_string():
    timestamp = str(int(time.time()))
    random_part = "".join(
        random.choices(
            string.ascii_uppercase + string.ascii_lowercase + string.digits, k=2
        )
    )
    unique_string = timestamp[-4:] + random_part
    return unique_string


def gmail_checker(username, password):
    i = imaplib.IMAP4_SSL("imap.gmail.com")
    try:
        i.login(username, password)
        return True
    except:
        return


def replace_placeholders(template, replacements):
    formatted_template = template
    for placeholder, value in replacements.items():
        formatted_template = formatted_template.replace("{" + placeholder + "}", value)
    return formatted_template


def get_user_deatils(user_id):
    url = f"https://netfree.link/api/user/get-filter-settings?id={str(user_id)}"
    login_url = "https://netfree.link/api/user/login-by-password"

    USER_PASSWORD = settings.USER_PASSWORD
    USERNAME = settings.USERNAME

    login_data = {"password": USER_PASSWORD, "phone": USERNAME}
    headers = {
        "authority": "netfree.link",
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
        "content-type": "application/json",
        "origin": "https://netfree.link",
        "referer": "https://netfree.link/app/",
        "save-data": "on",
        "sec-ch-ua": '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    }

    session = requests.Session()
    login_response = session.post(login_url, headers=headers, json=login_data)
    cookie = login_response.cookies.get_dict()
    headers["cookie"] = "; ".join([f"{name}={value}" for name, value in cookie.items()])
    tags_response = session.get(url, headers=headers)
    return tags_response


def post_user_data(user_id,tags,urls,data):
    url = "https://netfree.link/user/ajax/set-filter-settings"
    login_url = "https://netfree.link/api/user/login-by-password"

    USER_PASSWORD = settings.USER_PASSWORD
    USERNAME = settings.USERNAME

    login_data = {"password": USER_PASSWORD, "phone": USERNAME}
    headers = {
        "authority": "netfree.link",
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
        "content-type": "application/json",
        "origin": "https://netfree.link",
        "referer": "https://netfree.link/app/",
        "save-data": "on",
        "sec-ch-ua": '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    }
    inspectorSettings = data.get("inspectorSettings")
    inspectorSettings.update({'tagsList': tags, 'urls': urls })
    payload = {
        "id":int(user_id),
        "filterSettings": data.get("filterSettings"),
        "inspectorSettings": inspectorSettings
    }
    session = requests.Session()
    login_response = session.post(login_url, headers=headers, json=login_data)
    cookie = login_response.cookies.get_dict()
    headers["cookie"] = "; ".join([f"{name}={value}" for name, value in cookie.items()])
    tags_response = session.post(url, headers=headers,json=payload)
    return tags_response

def remove_duplicate_combinations(data):
    seen_combinations = set()
    final_list = []

    for entry in data:
        url = entry['url']
        rule = entry['rule']
        exp = entry.get('exp')
        combination = (url, rule)
        if exp:
            combination = (url, rule,exp)

        if combination not in seen_combinations:
            seen_combinations.add(combination)
            final_list.append(entry)

    return final_list

class NetfreeAPI:
    def __init__(self):
        self.headers = {
            "authority": "netfree.link",
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            "content-type": "application/json",
            "origin": "https://netfree.link",
            "referer": "https://netfree.link/app/",
            "save-data": "on",
            "sec-ch-ua": '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        }
        self.session = requests.Session()

    def login(self):
        login_url = "https://netfree.link/api/user/login-by-password"
        USER_PASSWORD = settings.USER_PASSWORD
        USERNAME = settings.USERNAME
        login_data = {"password": USER_PASSWORD, "phone": USERNAME}
        login_response = self.session.post(login_url, headers=self.headers, json=login_data)
        cookie = login_response.cookies.get_dict()
        self.headers["cookie"] = "; ".join(
            [f"{name}={value}" for name, value in cookie.items()]
        )
        return True
    def search_category(self, params):
        url = "https://netfree.link/api/tags/value/edit/get"
        valid_domain = self.find_domain(params)
        domain = (
            valid_domain.json().get("foundHost","") if valid_domain.status_code == 200 else ""
        )
        payload = json.dumps({"host": str(domain)})
        self.login()
        tags_response = self.session.post(url, headers=self.headers, data=payload)
        return tags_response

    def send_req(self,key):
        payload = json.dumps({"key": key})
        self.login()
        response = self.session.post("https://netfree.link/api/user/get-traffic-record", headers=self.headers, data=payload)
        return response
    def find_domain(self, params):
        url = "https://netfree.link/api/tags/search-url"
        payload = json.dumps({"search": params})
        self.login()
        response = self.session.post(url, headers=self.headers, data=payload)
        return response
    def get_user(self, user_id):
        user_id = int(''.join(filter(str.isdigit, user_id)))
        url = "https://netfree.link/api/users/search-user"
        payload = json.dumps({"search": user_id,"lastSurfing":False})
        self.login()
        response = self.session.post(url, headers=self.headers, data=payload)
        return response
    def get_user_deatils(self,user_id):
        url = f"https://netfree.link/api/user/get-filter-settings?id={str(user_id).strip()}"
        self.login()
        tags_response = self.session.get(url, headers=self.headers)
        return tags_response
    
    def post_user_data(self,user_id,urls,data):
        clean_user_id = ''.join(filter(str.isdigit, user_id))
        url = "https://netfree.link/user/ajax/set-filter-settings"
        inspectorSettings = data.get("inspectorSettings")
        inspectorSettings.update({'urls': urls })
        payload = {
            "id":int(clean_user_id),
            "filterSettings": data.get("filterSettings"),
            "inspectorSettings": inspectorSettings
        }
        self.login()
        tags_response = self.session.post(url, headers=self.headers,json=payload)
        return tags_response
    

def get_netfree_traffic_data(url):
    netfree = NetfreeAPI()
    key = url.split('/')[-1]
    res = netfree.send_req(key)
    if res.status_code == 200:
        data = res.json()
        results = data.get('traffic',[])
        urls = []
        netfree_urls = []
        custumer_id = None
        for i in results:
            url = None
            sector_block = None
            netfree_block = None
            for item in i:
                if item.get('block','') == "sector":
                    sector_block = True
                if item.get('block','') == "deny":
                    netfree_block = True

                if item.get('url'):
                    if item.get('url').startswith("https://") or item.get('url').startswith("http://"):
                        url = item.get('url')
                if item.get('action'):
                    input_string = item.get('action')
                    match = re.search(r'user::(\d+)::', input_string)

                    if match:
                        custumer_id = match.group(1)
            if sector_block:
                urls.append(url)
            if netfree_block:
                netfree_urls.append(url)
            if urls:
                urls = list(set(urls))
            if netfree_urls:
                netfree_urls = list(set(netfree_urls))
        
        data = {"netfree_url":netfree_urls,"sector_block":urls}
        return data,custumer_id
    return False

