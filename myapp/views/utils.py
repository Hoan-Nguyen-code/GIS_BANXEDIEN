from django.core.mail import send_mail
from django.template.loader import render_to_string

def send_invoice_email(order):
    user = order.user
    email = user.email

    subject = f"Hóa đơn đơn hàng #{order.id}"

    html_content = render_to_string('emails/invoice.html', {
        'user': user,
        'order': order,
        'items': order.items.all(),
        'total': order.total_price
    })

    send_mail(
        subject=subject,
        message='',
        from_email=None,
        recipient_list=[email],
        html_message=html_content
    )