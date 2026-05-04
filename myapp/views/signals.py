from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from myapp.models import Payment, Invoice
from .utils import send_invoice_email
import uuid


@receiver(post_save, sender=Payment)
def payment_success_handler(sender, instance, created, **kwargs):

    if instance.status == Payment.PaymentStatus.SUCCESS and instance.paid_at:

        order = instance.order

        invoice, created = Invoice.objects.get_or_create(
            order=order,
            defaults={
                "invoice_number": f"INV-{uuid.uuid4().hex[:10].upper()}",
                "issued_by": None
            }
        )

        if order.user.email:
            send_invoice_email(order)