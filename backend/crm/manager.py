import datetime
import logging
from urllib.parse import urlparse

from django.conf import settings
from django.template import loader
from utils.helper import (NetfreeAPI, replace_placeholders,
                          send_email_with_template)

cronjob_email_log = logging.getLogger('cronjob-email')
cronjob_error_log = logging.getLogger('cronjob-error')
class EmailRequestProcessor:
    def __init__(self,email_request=None):
        self.email_request = email_request
        self.netfree_api = NetfreeAPI()
        self.category_count = 0
        self.default = False
        self.all_urls = []
        self.actions_done = []
        self.weights = {
            'Send_email_template': 1,
            'Open_URL_for': 50,
            'Open_URL': 5000,
            'Open_Domain_for': 20000,
            'Open_Domain': 50000,
        }

    def update_usernmae_or_email(self):
        user_detail = self.netfree_api.get_user(self.email_request.customer_id)
        if user_detail.status_code == 200:
            data = user_detail.json()
            data = data.get('users',[])
            if len(data)>0:
                client_name = data[0].get('full_name',"")
                client_email = data[0].get("email","")
                self.email_request.username = client_name
                self.email_request.sender_email = client_email
            else:
                cronjob_error_log.error(f"requested id: {self.email_request.id} user data not found")
            url_without_www = self.email_request.requested_website
            if self.email_request.requested_website.startswith("https://"):
                url_without_www = url_without_www.replace("https://", "http://", 1)
            self.email_request.requested_website = url_without_www
            cronjob_email_log.info(f"user data id  name: {client_name} {client_email}.{user_detail} customer data : {str(data)}")

    def send_mail(self, template_name,email_to,custom_email=None):
        from crm.models import EmailTemplate, SMTPEmail
        try:
            template = EmailTemplate.objects.filter(name=template_name).first()
            if template:
                instance = SMTPEmail.objects.last()
                settings.EMAIL_HOST_USER = instance.email
                settings.EMAIL_HOST_PASSWORD = instance.password
                subject = self.email_request.id
                to_email = self.email_request.sender_email
                template_name = "email.html"
                admin_email = instance.email
                client_email = self.email_request.sender_email

                format_variables = {
                    "request_id": str(self.email_request.id),
                    "client_name": self.email_request.username,
                    "client_email": self.email_request.sender_email,
                    "admin_email": admin_email,
                    "domain_requested": self.email_request.requested_website,
                }
                context = {
                    "your_string": replace_placeholders(template.html, format_variables)
                }
                if email_to == "admin_email":
                    to_email = admin_email
                if email_to == "client_email":
                    to_email = client_email
                    if client_email=="":
                        to_email = admin_email
                if email_to == "custom":
                    to_email = custom_email

                subject = replace_placeholders(template.subject, format_variables)

                send_email_with_template(subject, to_email, template_name, context)
                cronjob_email_log.info(f"customer id : {self.email_request.customer_id}. email send to : {to_email}. domain_requested : {self.email_request.requested_website}. template id and name : {template.id}/{template.name}")
                return True
        except Exception as e:
            cronjob_error_log.error(f"requested id: {instance.id} customer id : {self.email_request.customer_id}. error while sending mail : {e}")
            pass
        return False
    
    def calculate_future_timestamp(self,amount, condition,current_datetime):
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

    def sync_data_with_netfree(self,urls):
        user_all_urls = urls
        user_detail = self.netfree_api.get_user_deatils(self.email_request.customer_id)
        if user_detail.status_code == 200:
            data = user_detail.json()
            cronjob_email_log.info(f"customer id : {self.email_request.customer_id}. customer data : {str(data)}")
            user_urls = data.get("inspectorSettings", {}).get("urls",[])
            user_all_urls += user_urls
            res = self.netfree_api.post_user_data(self.email_request.customer_id,user_all_urls,data)
            if res.status_code == 200:
                return True
            cronjob_error_log.error(f"requested id: {self.email_request.id} user_deatils update {str(user_detail.status_code)}")
        else:
            cronjob_error_log.error(f"requested id: {self.email_request.id} user_deatils {str(user_detail.status_code)}")
            return False
        
    def convert_condition_to_minutes(self,amount,condition):
        if condition == "Minutes":
            return amount
        elif condition == "Hours":
            return amount * 60
        elif condition == "Days":
            return amount * 60 * 24
        elif condition == "Weeks":
            return amount * 60 * 24 * 7
        else:
            raise ValueError("Invalid condition. Use 'Minutes', 'Hours', 'Days', or 'Weeks'.")
        
        
    def open_domain(self,label,url,amount,current_datetime):
        try:
            parts = url.split("://")
            protocol = parts[0] if len(parts) > 1 else None

            if protocol:
                domain_and_path = parts[1]
                domain, path = domain_and_path.split("/", 1)
            else:
                domain, path = parts[0].split("/", 1)
            
            # if domain.startswith("www."):
            #     domain = domain[4:]

            # Concatenate the protocol and domain
            full_domain = f"{protocol}://{domain}/"
            data = {"url":full_domain,
                    "rule":"open"}

            if label == "Open Domain for":
                timestamp = self.calculate_future_timestamp(amount,"Minutes",current_datetime)
                data.update({'exp':timestamp})
            return data
        except Exception as e:
            cronjob_error_log.error(f"requested id: {self.email_request.id} customer id : {self.email_request.customer_id}. error while open domain : {str(e)}")
            return False
        
        
    def is_domain_or_full_url(self,input_str):
        try:
            parsed_url = urlparse(input_str)
            if parsed_url.netloc and not parsed_url.path:
                return "Open Domain"
            elif parsed_url.netloc and parsed_url.path:
                return "Open URL"
            else:
                return "Invalid Input"
        except ValueError:
            return "Invalid Input"
        
        
    def find_categories_by_url_or_domain(self, url_or_domain: str):
        from clients.models import Client
        from crm.models import Actions, Categories, NetfreeCategoriesProfile
        res = self.netfree_api.search_category(url_or_domain)
        categories_list = []
        categories_data = {}
        if res.status_code == 200:
            try:
                keys = res.json()["tagValue"]["tags"].keys()
                categories_list = list(map(int, keys))
            except Exception as e:
                cronjob_error_log.error(f"requested id: {self.email_request.id} error {str(e)}")
                categories_list = []
        categories_obj = Categories.objects.filter(
                categories_id__in=[int(i) for i in categories_list]
            )
        self.category_count = categories_obj.count()
        empty = True
        data = {}
        client = Client.objects.filter(eav__email=self.email_request.sender_email).first()
        if client and client.netfree_profile:
            default_netfree_categories = client.netfree_profile
        else:
            default_netfree_categories, _ = NetfreeCategoriesProfile.objects.get_or_create(is_default=True)
        for i in categories_obj:
            data.update({i.id:[]})

            actions = Actions.objects.filter(category=i,netfree_profile=default_netfree_categories)
            if actions.exists():
                empty = False
                for action in actions:
                    if "Send email template" in action.label:
                        data.get(i.id).append({"url":action.label,"rule":"Send email template","exp":action.get_label.split("Send email template")[-1].strip(),'label':action.get_label,"email_to_admin":action.email_to_admin,"email_to_client":action.email_to_client,"custom_email":action.custom_email})
                    if "Open URL" in action.label:
                        data2 = {"url":action.label,"rule":"Open URL",'label':action.label}
                        if len(action.label.split("Open URL for"))==2:
                            amount_time = action.label.split("Open URL for")[1].strip().split(" ")
                            timestamp = self.convert_condition_to_minutes(int(amount_time[0]),amount_time[1])
                            data2.update({"rule":"Open URL for",'exp':timestamp})
                        data.get(i.id).append(data2)

                    if "Open Domain" in action.label:
                        data2 = {"url":action.label,"rule":"Open Domain",'label':action.label}
                        if len(action.label.split("Open Domain for"))==2:
                            amount_time = action.label.split("Open Domain for")[1].strip().split(" ")
                            timestamp = self.convert_condition_to_minutes(int(amount_time[0]),amount_time[1])
                            data2.update({"rule":"Open Domain for",'exp':timestamp})
                        data.get(i.id).append(data2)
        if empty:
            actions = Actions.objects.filter(is_default=True,category=None,netfree_profile=default_netfree_categories)
            self.default = True
            if actions.exists():
                data.update({"default":[]})
                empty = False
                for action in actions:
                    if "Send email template" in action.label:
                        data.get('default').append({"url":action.label,"rule":"Send email template","exp":action.get_label.split("Send email template")[-1].strip(),'label':action.get_label,"email_to_admin":action.email_to_admin,"email_to_client":action.email_to_client,"custom_email":action.custom_email})
                    if "Open URL" in action.label:
                        data2 = {"url":action.label,"rule":"Open URL",'label':action.label}
                        if len(action.label.split("Open URL for"))==2:
                            amount_time = action.label.split("Open URL for")[1].strip().split(" ")
                            timestamp = self.convert_condition_to_minutes(int(amount_time[0]),amount_time[1])
                            data2.update({"rule":"Open URL for",'exp':timestamp})
                        data.get('default').append(data2)
                    if "Open Domain" in action.label:
                        data2 = {"url":action.label,"rule":"Open Domain",'label':action.label}
                        if len(action.label.split("Open Domain for"))==2:
                            amount_time = action.label.split("Open Domain for")[1].strip().split(" ")
                            timestamp = self.convert_condition_to_minutes(int(amount_time[0]),amount_time[1])
                            data2.update({"rule":"Open Domain for",'exp':timestamp})
                        data.get('default').append(data2)
        categories_data.update(data)
        return categories_data
    
    
    def has_data_in_single_key(self,d):
        data_count = 0
        categories_key = False

        for key, value in d.items():
            if isinstance(value, list) and len(value) > 0:
                categories_key = key
                data_count += 1
                if data_count > 1:
                    return False,False # Data in more than one key

        return data_count == 1,categories_key
    
    
    def cate_process(self,categories):
        current_datetime = datetime.datetime.now()
        for action_data in categories:
            action = action_data.get('rule', '')  # Extract the action from the dictionary
            duration = action_data.get('exp', None)  # Extract the duration from the dictionary
            label = action_data.get('label', None)
            if action == 'Send email template':
                action_done = None
                email_to_admin = action_data.get('email_to_admin')
                if email_to_admin:
                    if self.send_mail(label.split("Send email template")[-1].strip(),'admin_email'): 
                        action_done = label
                        
                email_to_client = action_data.get('email_to_client')
                if email_to_client:
                    if self.send_mail(label.split("Send email template")[-1].strip(),'client_email'): 
                        action_done = label
                custom_email = action_data.get('custom_email')
                if custom_email:
                    custom_email_list = custom_email.split(',')
                    for i in custom_email_list:
                        if self.send_mail(label.split("Send email template")[-1].strip(),'custom',i):
                            action_done = label
                if action_done:
                    self.actions_done.append(action_done)
            elif action == 'Open URL':
                url_without_www = self.email_request.requested_website
                open_url_data = self.email_request.open_url("Open URL",url_without_www,current_datetime)
                if open_url_data:
                    self.all_urls.append(open_url_data)
                    self.actions_done.append(label)

            elif action == 'Open URL for':
                url_without_www = self.email_request.requested_website
                data = {"url":url_without_www,
                            "rule":"open"}
                timestamp = self.calculate_future_timestamp(duration,"Minutes",current_datetime)
                data.update({'exp':timestamp})
                self.all_urls.append(data)
                self.actions_done.append(label)
            elif action == 'Open Domain for':
                data = self.open_domain('Open Domain for',self.email_request.requested_website,duration,current_datetime)
                self.all_urls.append(data)
                self.actions_done.append(label)
            elif action == 'Open Domain':
                data = self.open_domain('Open Domain',self.email_request.requested_website,duration,current_datetime)
                self.all_urls.append(data)
                self.actions_done.append(label)
        return True

    def calculate_min_rank(self,data_list):

        all_process_cat_list = []
        for key, value in data_list.items():
            point = 0.0
            for item_list in value:
                if item_list['rule'] == "Send email template":
                    point += self.weights.get('Send_email_template')
                if item_list['rule'] == "Open URL for":
                    point += self.weights.get('Open_URL_for')
                    point += item_list['exp']/60*10
                if item_list['rule'] == "Open URL":
                    point += self.weights.get('Open_URL')
                if item_list['rule'] == "Open Domain for":
                    point += self.weights.get('Open_Domain_for')
                    point += item_list['exp']/60*10
                if item_list['rule'] == "Open Domain":
                    point += self.weights.get('Open_Domain')
            all_process_cat_list.append({key:point})
        min_key = None
        min_value = float('inf')

        for item in all_process_cat_list:
            for key, value in item.items():
                if value != 0.0 and value < min_value:
                    min_key = key
                    min_value = value
        if min_key:
            return min_key  

        return False
    
    def process(self):
        cronjob_email_log.debug(f"Requested id : {str(self.email_request.id)}")
        # Use find_categories_by_url_or_domain to get all actions and durations associated with the URL or domain
        categories_data = self.find_categories_by_url_or_domain(self.email_request.requested_website)
        single,cate_key = self.has_data_in_single_key(categories_data)
        cronjob_email_log.debug(f"customer id : {self.email_request.customer_id}. categories_data : {str(categories_data)}")
        cronjob_email_log.debug(f"customer id : {self.email_request.customer_id}. signle categories key  :{single} {str(cate_key)}")
        if single:
            if self.cate_process(categories_data.get(cate_key)):
                if self.all_urls:
                    cronjob_email_log.info(f"customer id : {self.email_request.customer_id}. total urls : {str(self.all_urls)}")
                    if not self.sync_data_with_netfree(self.all_urls):
                        cronjob_email_log.debug(f"customer id : {self.email_request.customer_id}. data sync faild  requested id : {str(self.email_request.id)}")
                        return False
                if self.actions_done:
                    self.email_request.action_done = " ,".join(self.actions_done)
                    self.email_request.save()
                    cronjob_email_log.info(f"customer id : {self.email_request.customer_id}. total action done : {str(self.actions_done)}")
                    cronjob_email_log.info(f"email request saving process end for customer id : {self.email_request.customer_id} ")
                    return True
                
        if not single and self.category_count>0:
            lowest_rank_key = self.calculate_min_rank(categories_data)
            cronjob_email_log.info(f"customer id : {self.email_request.customer_id}. lowest_rank_key : {str(lowest_rank_key)}")
            if lowest_rank_key and self.cate_process(categories_data.get(lowest_rank_key)):
                if self.all_urls:
                    if not self.sync_data_with_netfree(self.all_urls):
                        cronjob_email_log.debug(f"customer id : {self.email_request.customer_id}. data sync faild  requested id : {str(self.email_request.id)}")
                        return False
                if self.actions_done:
                    self.email_request.action_done = " ,".join(self.actions_done)
                    self.email_request.save()
                    cronjob_email_log.info(f"customer id : {self.email_request.customer_id}. total action done : {str(self.actions_done)}")
                    cronjob_email_log.info(f"email request saving process end for customer id : {self.email_request.customer_id} ")
                    return True
        return False


class NetfreeProcessor:
    def __init__(self,data,customer_id):
        self.customer_id = customer_id
        self.urls = data.get('sector_block')
        self.netfree_url = data.get('netfree_url')
        self.category_count = 0
        self.default = False
        self.netfree_api = NetfreeAPI()
        self.all_urls = []
        self.actions_done = []
        self.process_actions_urls = {}
    def has_data_in_single_key(self,d):
        data_count = 0
        categories_key = False

        for key, value in d.items():
            if isinstance(value, list) and len(value) > 0:
                categories_key = key
                data_count += 1
                if data_count > 1:
                    return False,False # Data in more than one key

        return data_count == 1,categories_key
    def open_domain(self,label,url,amount,current_datetime):
        try:
            parts = url.split("://")
            protocol = parts[0] if len(parts) > 1 else None

            if protocol:
                domain_and_path = parts[1]
                domain, path = domain_and_path.split("/", 1)
            else:
                domain, path = parts[0].split("/", 1)
            
            # if domain.startswith("www."):
            #     domain = domain[4:]

            # Concatenate the protocol and domain
            full_domain = f"{protocol}://{domain}/"
            data = {"url":full_domain,
                    "rule":"open"}

            if label == "Open Domain for":
                timestamp = self.calculate_future_timestamp(amount,"Minutes",current_datetime)
                data.update({'exp':timestamp})
            return data
        except Exception as e:
            cronjob_error_log.error(f"customer id : {self.customer_id}. error while open domain : {str(e)}")
            return False
    def open_url(self,label,url,current_datetime=False):
        try:
            data = {"url":url,
                    "rule":"open"}
            if len(label.split("Open URL for"))==2:
                amount_time = label.split("Open URL for")[1].strip().split(" ")
                timestamp = self.calculate_future_timestamp(int(amount_time[0]),amount_time[1],current_datetime)
                data.update({'exp':timestamp})
            return data
        except Exception as e:
            print(e)
            cronjob_error_log.error(f"customer id : {self.customer_id}. error while open url : {e}")
            return False
    def calculate_future_timestamp(self,amount, condition,current_datetime):
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
    def convert_condition_to_minutes(self,amount,condition):
        if condition == "Minutes":
            return amount
        elif condition == "Hours":
            return amount * 60
        elif condition == "Days":
            return amount * 60 * 24
        elif condition == "Weeks":
            return amount * 60 * 24 * 7
        else:
            raise ValueError("Invalid condition. Use 'Minutes', 'Hours', 'Days', or 'Weeks'.")
    def find_categories_by_url_or_domain(self, url_or_domain: str):
            from crm.models import (Actions, Categories,
                                    NetfreeCategoriesProfile)
            res = self.netfree_api.search_category(url_or_domain)
            categories_list = []
            categories_data = {}
            if res.status_code == 200:
                try:
                    keys = res.json()["tagValue"]["tags"].keys()
                    categories_list = list(map(int, keys))
                except Exception as e:
                    print(e)
                    # cronjob_error_log.error(f"requested id: {self.email_request.id} error {str(e)}")
                    categories_list = []
            categories_obj = Categories.objects.filter(
                    categories_id__in=[int(i) for i in categories_list]
                )
            self.category_count = categories_obj.count()
            empty = True
            data = {}
            for i in categories_obj:
                data.update({i.id:[]})
                default_netfree_categories, _ = NetfreeCategoriesProfile.objects.get_or_create(is_default=True)
                actions = Actions.objects.filter(category=i,netfree_profile=default_netfree_categories)
                if actions.exists():
                    empty = False
                    for action in actions:
                        if "Send email template" in action.label:
                            data.get(i.id).append({"url":action.label,"rule":"Send email template","exp":action.get_label.split("Send email template")[-1].strip(),'label':action.get_label,"email_to_admin":action.email_to_admin,"email_to_client":action.email_to_client,"custom_email":action.custom_email})
                        if "Open URL" in action.label:
                            data2 = {"url":action.label,"rule":"Open URL",'label':action.label}
                            if len(action.label.split("Open URL for"))==2:
                                amount_time = action.label.split("Open URL for")[1].strip().split(" ")
                                timestamp = self.convert_condition_to_minutes(int(amount_time[0]),amount_time[1])
                                data2.update({"rule":"Open URL for",'exp':timestamp})
                            data.get(i.id).append(data2)

                        if "Open Domain" in action.label:
                            data2 = {"url":action.label,"rule":"Open Domain",'label':action.label}
                            if len(action.label.split("Open Domain for"))==2:
                                amount_time = action.label.split("Open Domain for")[1].strip().split(" ")
                                timestamp = self.convert_condition_to_minutes(int(amount_time[0]),amount_time[1])
                                data2.update({"rule":"Open Domain for",'exp':timestamp})
                            data.get(i.id).append(data2)
            if empty:
                default_netfree_categories, _ = NetfreeCategoriesProfile.objects.get_or_create(is_default=True)
                actions = Actions.objects.filter(is_default=True,category=None,netfree_profile=default_netfree_categories)
                self.default = True
                if actions.exists():
                    data.update({"default":[]})
                    empty = False
                    for action in actions:
                        if "Send email template" in action.label:
                            data.get('default').append({"url":action.label,"rule":"Send email template","exp":action.get_label.split("Send email template")[-1].strip(),'label':action.get_label,"email_to_admin":action.email_to_admin,"email_to_client":action.email_to_client,"custom_email":action.custom_email})
                        if "Open URL" in action.label:
                            data2 = {"url":action.label,"rule":"Open URL",'label':action.label}
                            if len(action.label.split("Open URL for"))==2:
                                amount_time = action.label.split("Open URL for")[1].strip().split(" ")
                                timestamp = self.convert_condition_to_minutes(int(amount_time[0]),amount_time[1])
                                data2.update({"rule":"Open URL for",'exp':timestamp})
                            data.get('default').append(data2)
                        if "Open Domain" in action.label:
                            data2 = {"url":action.label,"rule":"Open Domain",'label':action.label}
                            if len(action.label.split("Open Domain for"))==2:
                                amount_time = action.label.split("Open Domain for")[1].strip().split(" ")
                                timestamp = self.convert_condition_to_minutes(int(amount_time[0]),amount_time[1])
                                data2.update({"rule":"Open Domain for",'exp':timestamp})
                            data.get('default').append(data2)
            categories_data.update(data)
            return categories_data
    def cate_process(self,categories,url):
        current_datetime = datetime.datetime.now()
        for action_data in categories:
            action = action_data.get('rule', '')  # Extract the action from the dictionary
            duration = action_data.get('exp', None)  # Extract the duration from the dictionary
            label = action_data.get('label', None)

            if action == 'Open URL':
                url_without_www = url
                open_url_data = self.open_url("Open URL",url_without_www,current_datetime)
                if open_url_data:
                    self.all_urls.append(open_url_data)
                    self.actions_done.append(label)
                    if self.process_actions_urls.get(label):
                        self.process_actions_urls.get(label).append(url)
                    else:
                        self.process_actions_urls[label] = [url]

            elif action == 'Open URL for':
                url_without_www = url
                data = {"url":url_without_www,
                            "rule":"open"}
                timestamp = self.calculate_future_timestamp(duration,"Minutes",current_datetime)
                data.update({'exp':timestamp})
                self.all_urls.append(data)
                self.actions_done.append(label)
                if self.process_actions_urls.get(label):
                    self.process_actions_urls.get(label).append(url)
                else:
                    self.process_actions_urls[label] = [url]
            elif action == 'Open Domain for':
                data = self.open_domain('Open Domain for',url,duration,current_datetime)
                self.all_urls.append(data)
                self.actions_done.append(label)
                if self.process_actions_urls.get(label):
                    self.process_actions_urls.get(label).append(url)
                else:
                    self.process_actions_urls[label] = [url]
            elif action == 'Open Domain':
                data = self.open_domain('Open Domain',url,duration,current_datetime)
                self.all_urls.append(data)
                self.actions_done.append(label)
                if self.process_actions_urls.get(label):
                    self.process_actions_urls.get(label).append(url)
                else:
                    self.process_actions_urls[label] = [url] 
        return True
    
    def ren(self,template_name,url,pretext="",aftertext="",time=''):
        templates = loader.get_template('gen.html')
        email_html = templates.render({'urls': url,"pretext":pretext,"aftertext":aftertext,"time":time})
        return email_html
    
    def process(self):
        from crm.models import EmailTemplate, SMTPEmail,Hoursvalues
        template = EmailTemplate.objects.filter(id=4).first()
        if self.urls:
            for url in self.urls:
                if url.startswith("https://"):
                    url = url.replace("https://", "http://", 1)
                categories_data = self.find_categories_by_url_or_domain(url)
                single,cate_key = self.has_data_in_single_key(categories_data)

                if single:
                    if self.cate_process(categories_data.get(cate_key),url):
                        pass
                        # print(self.all_urls)
                        # print(self.actions_done)


        instance = SMTPEmail.objects.last()
        settings.EMAIL_HOST_USER = instance.email
        settings.EMAIL_HOST_PASSWORD = instance.password
        template_name = "email.html"
        client_email = "prashant@prashantsaini.me"
        templates = loader.get_template('open-domain.html')
        traffic_recording_open_domain_temporary = ""
        traffic_recording_open_url_temporary = ""
        for key,item in self.process_actions_urls.items():
            if "Open Domain for" in key:
                time = key.split("Open Domain for")[-1]
                predeafault = Hoursvalues.objects.filter(is_default=True,text_type="pre_text",website="open_domain_temporary").first()
                afterdeafault = Hoursvalues.objects.filter(is_default=True,text_type="after_text",website="open_domain_temporary").first()
                pretext = Hoursvalues.objects.filter(hour=50,text_type="pre_text",website="open_domain_temporary").first() if Hoursvalues.objects.filter(hour=50,text_type="pre_text",website="open_domain_temporary").first() else predeafault
                aftertext = Hoursvalues.objects.filter(hour=50,text_type="after_text",website="open_domain_temporary").first() if Hoursvalues.objects.filter(hour=50,text_type="after_text",website="open_domain_temporary").first() else afterdeafault
                traffic_recording_open_domain_temporary += self.ren(template_name='gen.html',url=self.process_actions_urls.get(key),pretext=pretext.text,aftertext=aftertext.text,time=time)
            if "Open URL for" in key:
                time = key.split("Open URL for")[-1]
                predeafault = Hoursvalues.objects.filter(is_default=True,text_type="pre_text",website="open_url_temporary").first()
                afterdeafault = Hoursvalues.objects.filter(is_default=True,text_type="after_text",website="open_url_temporary").first()
                pretext = Hoursvalues.objects.filter(hour=50,text_type="pre_text",website="open_url_temporary").first() if Hoursvalues.objects.filter(hour=50,text_type="pre_text",website="open_url_temporary").first() else predeafault
                aftertext = Hoursvalues.objects.filter(hour=50,text_type="after_text",website="open_url_temporary").first() if Hoursvalues.objects.filter(hour=50,text_type="after_text",website="open_url_temporary").first() else afterdeafault
                traffic_recording_open_url_temporary += self.ren(template_name='gen.html',url=self.process_actions_urls.get(key),pretext=pretext.text,aftertext=aftertext.text,time=time)


        format_variables = {
                "client_email": "prashant@prashantsaini.me",
                "traffic_recording_open_domain_pre_text":Hoursvalues.objects.filter(website='open_domain',text_type='pre_text').first().text,
                "traffic_recording_open_domain_list":self.ren('gen.html',self.process_actions_urls.get('Open Domain')),
                "traffic_recording_open_domain_after_text":Hoursvalues.objects.filter(website='open_domain',text_type='after_text').first().text,
                "traffic_recording_open_url_pre_text":Hoursvalues.objects.filter(website='open_url',text_type='pre_text').first().text,
                "traffic_recording_open_url_list":self.ren('gen.html',self.process_actions_urls.get('Open URL')),
                "traffic_recording_open_url_after_text":Hoursvalues.objects.filter(website='open_url',text_type='after_text').first().text,
                "traffic_recording_blocked_pre_text":Hoursvalues.objects.filter(website='netfree_block',text_type='pre_text').first().text,
                "traffic_recording_blocked_list":self.ren('gen.html',self.process_actions_urls.get('Open URL for 10 Hours')),
                "traffic_recording_blocked_after_text":Hoursvalues.objects.filter(website='netfree_block',text_type='after_text').first().text,
                # "traffic_recording_open_domain_temporary_pre_text":test_dict_pre.get('50 Hours'),
                # "traffic_recording_open_domain_temporary_x_x":"Open Domain for 50 Hours".split("Open Domain for")[1].strip(),
                # "traffic_recording_open_domain_temporary_list":self.ren(self.process_actions_urls.get('Open Domain')),
                "traffic_recording_open_domain_temporary":traffic_recording_open_domain_temporary,
                "traffic_recording_open_url_temporary":traffic_recording_open_url_temporary,
                # "traffic_recording_open_domain_temporary_after_text":test_dict_after.get('50 Hours'),
                # "traffic_recording_open_url_temporary_pre_text":test_url_dict_pre.get('50 Hours'),
                # "traffic_recording_open_url_temporary_x_x":"Open Domain for 50 Hours".split("Open Domain for")[1].strip(),
                # "traffic_recording_open_url_temporary_list":self.ren(self.process_actions_urls.get('Open Domain')),
                # "traffic_recording_open_url_temporary_after_text":test_url_dict_after.get('50 Hours'),
                }
        context = {
                "your_string": replace_placeholders(template.html, format_variables)
            }
        to_email = client_email
        subject = replace_placeholders(template.subject, format_variables)
        send_email_with_template(subject, to_email, template_name, context)
        





