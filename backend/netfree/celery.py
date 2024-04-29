import os

from celery import Celery

# set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'netfree.settings')

app = Celery('netfree', backend='redis')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')
app.conf.broker_url = 'redis://localhost:6379/0'  # Use a specific Redis database
app.conf.result_backend = 'redis://localhost:6379/1'
# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'my-celery-task': {
        'task': 'crm.tasks.read_emails',  # Path to your Celery task
        'schedule': 5.0,  # Run every 15 seconds
    },
}