import json
import os
import re

from crm import models
from rest_framework import serializers


class EmailrequestSerializer(serializers.ModelSerializer):
    request_type = serializers.CharField(
        default="פתיחת אתר - נטפרי"
    )
    text = serializers.SerializerMethodField()
    action_done = serializers.SerializerMethodField()
    class Meta:
        model = models.Emailrequest
        fields = ["id","email_id","sender_email","username","request_type","text","action_done","customer_id","ticket_id","requested_website","created_at"]

    def get_text(self,obj):
        paragraphs = re.split(r'\n\s*\n', obj.text)
        try:
            return paragraphs[-3]
        except Exception as e:
            return obj.text
    def get_action_done(self,obj):
        lang = self.context.get("lang",'en')
        with open("../frontend/src/locales/he.json", 'r', encoding='utf-8') as json_file:
            data = json.load(json_file)
            data = data.get('netfree',{})
        actions_hebrew_name = {
            "Open URL": data.get("open_url","Open URL"),
            "Open URL for": data.get("open_url_for","Open URL for"),
            "Open Domain":data.get("open_domain","Open Domain"),
            "Open Domain for": data.get("open_domain_for","Open Domain for"),
            "Send email template": data.get("send_email_template",'Send email template')
        }
        if lang == 'he':
            actions = obj.action_done.split(",")
            for index,item in enumerate(actions):
                item = item
                if "Open URL for" in item:
                    item = item.replace("Open URL for",actions_hebrew_name.get("Open URL for")).replace('Hours',data.get('hours')).replace('Minutes',data.get('minutes')).replace('Days',data.get('days')).replace('Weeks',data.get('weeks'))
                if "Open Domain for" in item :
                    item = item.replace("Open Domain for",actions_hebrew_name.get("Open Domain for")).replace('Hours',data.get('hours')).replace('Minutes',data.get('minutes')).replace('Days',data.get('days')).replace('Weeks',data.get('weeks'))
                if "Send email template" in item:
                    try:
                        templete = str(item).split("Send email template")
                        if len(templete)==2:
                            item =  actions_hebrew_name.get("Send email template", "Send email template")+" "+templete[1]
                    except Exception:
                        item = item
                hebrew_name = actions_hebrew_name.get(item.strip(), None)
                if hebrew_name:
                    item = hebrew_name
                actions[index] = item
            return ", ".join(actions)
        return obj.action_done



class ActionsSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()
    class Meta:
        model = models.Actions
        fields = ("id","label",'email_to_admin','email_to_client','custom_email','is_default_netfree_traffic','netfree_profile')

    def get_label(self,obj):
        lang = self.context.get("lang")
        data = obj.localized_label(lang)
        return data

class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.EmailTemplate
        exclude = ("html",)


class EmailTemplateListSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.EmailTemplate
        fields = ('id', 'name')


class CategoriesSerializer(serializers.ModelSerializer):
    request_type = serializers.CharField(
        default="פתיחת אתר - נטפרי"
    )
    name = serializers.CharField(
        source="description", default="פתיחת אתר - נטפרי"
    )
    actions = serializers.SerializerMethodField()

    class Meta:
        model = models.Categories
        fields = (
            "id","categories_id", "name", "actions", "request_type"
        )

    def get_actions(self, instance):
        lang = self.context.get("lang")
        netfree_profile = self.context.get("profile_obj")
        def fill_label(item):
            return {
                "id": item["id"],
                "label": item["label"].format("https://kehillos.com/", "5")} if '{}' in item["label"] else item
        data = instance.action_category.filter(template=False,netfree_profile=netfree_profile)
        data = ActionsSerializer(data, many=True, context = {"lang":lang}).data
        data_filled = list(map(fill_label, data))
        return data_filled


class EmailTemplateSchema(serializers.Serializer):
    name = serializers.CharField()
    email_to = serializers.CharField()
    subject = serializers.CharField()
    body = serializers.JSONField()

class NetfreeTrafficSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.NetfreeTraffic
        fields = '__all__'


class NetfreeCategoriesProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.NetfreeCategoriesProfile
        fields = '__all__'