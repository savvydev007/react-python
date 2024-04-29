import eav
from crm.models import NetfreeCategoriesProfile
from django.db import models
from eav.decorators import register_eav
from eav.models import Attribute
from django.db.models.signals import pre_save
from django.dispatch import receiver

def get_or_create_default_netfree_categories():
    default_netfree_categories, _ = NetfreeCategoriesProfile.objects.get_or_create(is_default=True)
    return default_netfree_categories

# Create your models here.
class NetfreeUser(models.Model):
    user_id = models.CharField(max_length=100,unique=True)
    email = models.CharField(max_length=200,unique=True)
    name = models.CharField(max_length=100, null=True, blank=True,default="")
    full_name = models.CharField(max_length=100, null=True, blank=True,default="")
    first_name = models.CharField(max_length=100, null=True, blank=True,default="")
    last_name = models.CharField(max_length=100, null=True, blank=True,default="")
    phone = models.CharField(max_length=100, null=True, blank=True,default="")
    netfree_profile = models.ForeignKey(NetfreeCategoriesProfile,default=1,on_delete=models.SET_DEFAULT,blank=True,null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return f"{self.user_id} - {str(self.email)}"

class Client(models.Model):
    netfree_profile = models.ForeignKey(NetfreeCategoriesProfile,default=1,on_delete=models.SET_DEFAULT,blank=True,null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Block(models.Model):
    name = models.CharField(max_length=100, null=True, blank=True,default="")
    is_delete = models.BooleanField(default=True)
    is_editable = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=1)
    field_name_language = models.JSONField(default={})
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def save(self, *args, **kwargs):
        if not self.pk:
            # This is a new instance, so get the max display_order and increment by 1
            max_display_order = Block.objects.aggregate(models.Max('display_order'))['display_order__max']
            if max_display_order is not None:
                self.display_order = max_display_order + 1

        super().save(*args, **kwargs)
    def __str__(self):
        return str(self.display_order) + " " + self.name

class BlockField(models.Model):
    block = models.ForeignKey(Block,on_delete=models.CASCADE,blank=True,null=True)
    datatype = models.CharField(max_length=100, null=True, blank=True,default=None)
    field_name_language = models.JSONField(default={})
    attribute = models.ForeignKey(Attribute,on_delete=models.CASCADE,blank=True,null=True)
    required = models.BooleanField(default=False)
    defaultvalue = models.CharField(max_length=100, null=True, blank=True,default=None)
    unique = models.BooleanField(default=False)
    is_delete = models.BooleanField(default=True)
    is_editable = models.BooleanField(default=True)
    display = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def save(self, *args, **kwargs):
        if not self.pk:
            # This is a new instance, so get the max display_order and increment by 1
            max_display_order = BlockField.objects.aggregate(models.Max('display_order'))['display_order__max']
            if max_display_order is not None:
                self.display_order = max_display_order + 1

        super().save(*args, **kwargs)

    def __str__(self):
        return str(self.display_order) + " " + self.attribute.name
@receiver(pre_save, sender=Attribute)
def my_pre_save_receiver(sender, instance, **kwargs):
    instance.name = instance.name.capitalize()
    base_slug = instance.name.lower().replace(" ", "_")
    unique_slug = base_slug
    count = 1

    while Attribute.objects.filter(slug=unique_slug).exclude(pk=instance.pk).exists():
        unique_slug = f"{base_slug}_{count}"
        count += 1

    instance.slug = unique_slug

eav.register(Client)