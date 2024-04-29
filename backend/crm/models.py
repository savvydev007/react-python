import datetime
import json
import logging

import requests
from crm.manager import EmailRequestProcessor
from django.conf import settings
from django.db import models, transaction
from django.db.models.signals import post_save
from django.db.utils import IntegrityError
from django.dispatch import receiver
from utils.helper import (NetfreeAPI, replace_placeholders,
                          send_email_with_template)

cronjob_email_log = logging.getLogger('cronjob-email')
cronjob_error_log = logging.getLogger('cronjob-error')
netfree_obj = NetfreeAPI()
def get_or_create_default_netfree_categories():
    default_netfree_categories, _ = NetfreeCategoriesProfile.objects.get_or_create(is_default=True)
    return default_netfree_categories
class NetfreeCategoriesProfile(models.Model):
    name = models.CharField(max_length=100, null=True, blank=True,default="deafult")
    description = models.CharField(max_length=100, null=True, blank=True,default="")
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return f"{self.name}"


def calculate_future_timestamp(amount, condition,current_datetime):
    if condition == "Minutes":
        future_datetime = current_datetime + datetime.timedelta(minutes=amount)
    elif condition == "Hours":
        future_datetime = current_datetime + datetime.timedelta(hours=amount)
    elif condition == "Days":
        future_datetime = current_datetime + datetime.timedelta(days=amount)
    elif condition == "Weeks":
        future_datetime = current_datetime + datetime.timedelta(weeks=amount)
    else:
        raise ValueError("Invalid condition. Use 'minute', 'hour', 'day', or 'week'.")

    future_timestamp = int(future_datetime.timestamp() * 1000)
    return future_timestamp
class Categories(models.Model):
    description = models.CharField(max_length=2000)
    categories_id = models.IntegerField()

    def __str__(self):
        return f"{self.description} - {str(self.categories_id)}"

    def search_category(self, params):
        url = "https://netfree.link/api/tags/value/edit/get"
        login_url = "https://netfree.link/api/user/login-by-password"

        USER_PASSWORD = settings.USER_PASSWORD
        USERNAME = settings.USERNAME

        login_data = {"password": USER_PASSWORD, "phone": USERNAME}

        valid_domain = self.find_domain(params)
        domain = (
            valid_domain.json()["foundHost"] if valid_domain.status_code == 200 else ""
        )
        payload = json.dumps({"host": str(domain)})
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
        headers["cookie"] = "; ".join(
            [f"{name}={value}" for name, value in cookie.items()]
        )
        tags_response = session.post(url, headers=headers, data=payload)
        return tags_response

    def find_domain(self, params):
        url = "https://netfree.link/api/tags/search-url"
        login_url = "https://netfree.link/api/user/login-by-password"

        USER_PASSWORD = settings.USER_PASSWORD
        USERNAME = settings.USERNAME

        login_data = {"password": USER_PASSWORD, "phone": USERNAME}

        payload = json.dumps({"search": params})
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
        headers["cookie"] = "; ".join(
            [f"{name}={value}" for name, value in cookie.items()]
        )
        response = session.post(url, headers=headers, data=payload)
        return response

class NetfreeTraffic(models.Model):
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    category = models.ForeignKey(
        Categories,
        on_delete=models.SET_NULL,
        null=True,
        related_name="netfree_traffic",
        blank=True,
        default=None,
    )
    netfree_profile = models.ForeignKey(NetfreeCategoriesProfile,default=1,on_delete=models.CASCADE,blank=True,null=True)

class Hoursvalues(models.Model):
    CHOICES = (
        ('pre_text', 'pre_text'),
        ('after_text', 'after_text')
    )
    WEBSITE_CHOICES = (
        ('open_url', 'open_url'),
        ('open_domain', 'open_domain'),
        ('open_url_temporary', 'open_url_temporary'),
        ('open_domain_temporary', 'open_domain_temporary'),
        ('netfree_block', 'netfree_block')
    )
    text = models.CharField(max_length=2000)
    hour = models.IntegerField()
    text_type = models.CharField(max_length=50,choices=CHOICES)
    website = models.CharField(max_length=50,choices=WEBSITE_CHOICES)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return self.text_type + " " + self.website + " " + self.text

class Actions(models.Model):
    label = models.CharField(max_length=200)
    is_default = models.BooleanField(default=False)
    is_default_netfree_traffic = models.BooleanField(default=False)
    template = models.BooleanField(default=False)
    email_template = models.ForeignKey('crm.EmailTemplate',on_delete=models.CASCADE,null=True,blank=True)
    category = models.ForeignKey(
        Categories,
        on_delete=models.SET_NULL,
        null=True,
        related_name="action_category",
        blank=True,
        default=None,
    )
    email_to_admin = models.BooleanField(default=False)
    email_to_client = models.BooleanField(default=False)
    custom_email = models.CharField(max_length=2000,blank=True,null=True)
    netfree_profile = models.ForeignKey(NetfreeCategoriesProfile,default=1,on_delete=models.CASCADE,blank=True,null=True)
    
    def save(self, *args, **kwargs):
        actions_hebrew_name = {
            "Open URL": "פתח כתובת אתר",
            "Open URL for": "פתח כתובת אתר עבור",
            "Open Domain": "פתח דומיין",
            "Open Domain for": "פתח דומיין עבור",
            "Send email template": "שלח תבנית אימייל"
        }
        actions_no = {
            "Send email template": 1,
            "Open Domain": 2,
            "Open URL": 3,
            "Open URL for": 4,
            "Open Domain for": 5
        }

        super().save(*args, **kwargs)
    
    @property
    def get_label(self):
        if "Send email template" in self.label:
            try:
                return self.label+" "+self.email_template.name
            except Exception:
                return self.label
        return self.label
        
            
    def localized_label(self, lang = 'he'):
        with open(f"../frontend/src/locales/{lang}.json", 'r', encoding='utf-8') as json_file:
            data = json.load(json_file)
            data = data.get('netfree',{})
        actions_hebrew_name = {
            "Open URL": data.get("open_url","Open URL"),
            "Open URL for": data.get("open_url_for","Open URL for"),
            "Open Domain":data.get("open_domain","Open Domain"),
            "Open Domain for": data.get("open_domain_for","Open Domain for"),
            "Send email template": data.get("send_email_template",'Send email template')
        }
        if lang == "he":
            if "Open URL for" in self.label and "Open URL for X X" not in self.label:
                self.label = self.label.replace("Open URL for",actions_hebrew_name.get("Open URL for")).replace('Hours',data.get('hours')).replace('Minutes',data.get('minutes')).replace('Days',data.get('days')).replace('Weeks',data.get('weeks'))
            if "Open Domain for" in self.label and "Open Domain for X X" not in self.label:
                self.label = self.label.replace("Open Domain for",actions_hebrew_name.get("Open Domain for")).replace('Hours',data.get('hours')).replace('Minutes',data.get('minutes')).replace('Days',data.get('days')).replace('Weeks',data.get('weeks'))
            if self.label == "Open Domain for X X":
                self.label = actions_hebrew_name.get("Open Domain for", None) + " " + "X X"
            if self.label == "Open URL for X X":
                self.label = actions_hebrew_name.get("Open URL for", None) + " " + "X X"
            hebrew_name = actions_hebrew_name.get(self.label, None)
            if hebrew_name:
                self.label = hebrew_name
        
        
        if "Send email template" in self.label or "שלח תבנית אימייל" in self.label:
            try:
                label = self.label+" "+self.email_template.name 
                
                if self.email_to_admin or self.email_to_client or self.custom_email:
                    label = label + f" {data.get('to')}"
                if self.email_to_admin:
                    label = label  + f" {data.get('admin')}"
                if self.email_to_client:
                    if self.email_to_admin:
                        label = label+" /"
                    label = label  + f" {data.get('client')}"
                if self.custom_email:
                    if self.email_to_admin or self.email_to_client:
                        label = label+" /"
                    label = label + f" {data.get('customEmail')}"
                return label
            except Exception:
                return self.label
        return self.label


# @receiver(post_save, sender=Categories)
# def update_stock(sender, instance, **kwargs):
#     default_action = Actions.objects.
#     instance.actions =
#     instance.actions.save()


class Emailrequest(models.Model):
    email_id = models.BigIntegerField()
    sender_email = models.CharField(max_length=320)
    username = models.CharField(max_length=100, null=True, default=None)
    text = models.TextField(default="")
    request_type = models.CharField(max_length=320,default="פתיחת אתר - נטפרי")
    action_done = models.CharField(max_length=500, null=True, default="")
    customer_id = models.CharField(max_length=100)
    ticket_id = models.CharField(max_length=100, null=True, default=None)
    requested_website = models.CharField(max_length=2000)
    created_at = models.DateTimeField()
    def save(self,*args,**kwargs):
        from clients.models import Client
        url_without_www = self.requested_website
        if self.requested_website.startswith("https://"):
            url_without_www = url_without_www.replace("https://", "http://", 1)
            self.requested_website = url_without_www
        user_detail = netfree_obj.get_user(self.customer_id)
        if user_detail.status_code == 200:
            data = user_detail.json()
            data = data.get('users',[])
            if len(data)>0:
                client_name = data[0].get('full_name',"")
                client_email = data[0].get("email","")
                client = Client.objects.filter(eav__email=client_email).first()
                if client:
                    self.username = client.eav.first_name
                    self.sender_email = client.eav.email
                else:
                    self.username = client_name
                    self.sender_email = client_email
                
        super(Emailrequest,self).save(*args,**kwargs)

    def send_mail(self, template_name):
        try:
            template = EmailTemplate.objects.filter(name=template_name).first()
            if template:
                instance = SMTPEmail.objects.last()
                settings.EMAIL_HOST_USER = instance.email
                settings.EMAIL_HOST_PASSWORD = instance.password
                subject = self.id
                to_email = self.sender_email
                template_name = "email.html"
                admin_email = instance.email
                format_variables = {
                    "request_id": str(self.id),
                    "client_name": self.username,
                    "client_email": self.sender_email,
                    "admin_email": admin_email,
                    "domain_requested": self.requested_website,
                }
                context = {
                    "your_string": replace_placeholders(template.html, format_variables)
                }
                if template.email_to == "admin_email":
                    to_email = admin_email

                send_email_with_template(subject, to_email, template_name, context)
                cronjob_email_log.info(f"customer id : {self.customer_id}. email send to : {to_email}. domain_requested : {self.requested_website}. template id and name : {template.id}/{template.name}")
                return True
        except Exception as e:
            cronjob_email_log.error(f"customer id : {self.customer_id}. error while sending mail : {e}")
        return False

    def open_url(self,label,url,current_datetime=False):
        try:
            data = {"url":url,
                    "rule":"open"}
            if len(label.split("Open URL for"))==2:
                amount_time = label.split("Open URL for")[1].strip().split(" ")
                timestamp = calculate_future_timestamp(int(amount_time[0]),amount_time[1],current_datetime)
                data.update({'exp':timestamp})
            cronjob_email_log.info(f"customer id : {self.customer_id}. open url : {json.dumps(data)}")
            return data
        except Exception as e:
            print(e)
            cronjob_error_log.error(f"requested id: {self.email_request.id} customer id : {self.customer_id}. error while open url : {e}")
            return False

    def open_domain(self,label,url,current_datetime):
        try:
            parts = url.split("://")
            protocol = parts[0] if len(parts) > 1 else None

            if protocol:
                domain_and_path = parts[1]
                domain, path = domain_and_path.split("/", 1)
            else:
                domain, path = parts[0].split("/", 1)

            # Concatenate the protocol and domain
            full_domain = f"{protocol}://{domain}"
            data = {"url":full_domain,
                    "rule":"open"}

            if len(label.split("Open Domain for"))==2:
                amount_time = label.split("Open Domain for")[1].strip().split(" ")
                timestamp = calculate_future_timestamp(int(amount_time[0]),amount_time[1],current_datetime)
                data.update({'exp':timestamp})
            cronjob_email_log.info(f"customer id : {self.customer_id}. open doamin : {json.dumps(data)}")
            return data
        except Exception as e:
            print(e)
            cronjob_email_log.error(f"customer id : {self.customer_id}. error while open domain : {e}")
            return False


@receiver(post_save, sender=Emailrequest)
def email_request_created_or_updated(sender, instance, created, **kwargs):
    if created:
        from crm.tasks import netfree_traffic_record
        if hasattr(instance, '_processing'):
            return
        instance._processing = True
        
        try:
            result = netfree_traffic_record.delay(instance.id)
        except IntegrityError as e:
            # Handle the specific database integrity error, if necessary
            cronjob_error_log.error(f"requested id: {instance.id} IntegrityError occurred: {str(e)}")
        except Exception as e:
            print(e)
            # Handle other exceptions that may occur during processing
            cronjob_error_log.error(f"requested id: {instance.id} An error occurred during email processing: {str(e)}")
        finally:
            if hasattr(instance, '_processing'):
                del instance._processing

class EmailTemplate(models.Model):
    name = models.CharField(max_length=100, unique=True)
    email_to = models.CharField(max_length=320)
    subject = models.CharField(max_length=100)
    design = models.JSONField()
    html = models.TextField()
    action = models.ForeignKey(
        Actions, on_delete=models.SET_NULL, null=True, blank=True, default=None
    )


class SMTPEmail(models.Model):
    email = models.EmailField()
    password = models.CharField(max_length=200)
