from django.contrib import admin
from . import models

# Register your models here.
admin.site.register(models.Categories)
admin.site.register(models.Emailrequest)
admin.site.register(models.EmailTemplate)
admin.site.register(models.SMTPEmail)
admin.site.register(models.NetfreeCategoriesProfile)
admin.site.register(models.NetfreeTraffic)
admin.site.register(models.Hoursvalues)


@admin.register(models.Actions)
class AdminActions(admin.ModelAdmin):
    list_display = ("id", "label", "template", "is_default",'email_template','category','localized_label')