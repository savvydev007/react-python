from celery import shared_task
from crm.manager import EmailRequestProcessor
from crm.models import Emailrequest
from crm.views import ReadEmail


@shared_task
def read_emails():
    print(" task one called and worker is running good")
    obj = ReadEmail()
    obj.read_email_from_gmail()
    return "success"


@shared_task
def netfree_traffic_record(email_request_id):
    email_request = Emailrequest.objects.get(id=email_request_id)
    obj = EmailRequestProcessor(email_request)
    if obj.process():
        return f"email request {str(email_request.id)} success"
    return f"False email request {str(email_request.id)}"