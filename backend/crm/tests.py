import imaplib

# Replace these with your actual email credentials and server settings
FROM_EMAIL = "ועד שמרם"
FROM_PWD = "exnjimfxvjejnugi"
SMTP_SERVER = "imap.gmail.com"



import imaplib

# Replace these with your actual email credentials and server settings
# FROM_EMAIL = "your_email@example.com"
# FROM_PWD = "your_email_password"
# SMTP_SERVER = "imap.example.com"

# Function to fetch emails from a specific mailbox
def fetch_emails_from_mailbox(imap_server, mailbox):
    try:
        print(f"Fetching emails from {mailbox}...")
        # if mailbox == "Sent":
        #     imap_server.create("Sent")
        typ, data = imap_server.select(mailbox, readonly=True)
        if typ != "OK":
            print(f"Error selecting mailbox {mailbox}: {data}")
            return

        status, message_ids = imap_server.search(None, 'ALL')
        if status != "OK":
            print(f"Error searching emails in {mailbox}: {message_ids}")
            return

        message_ids = message_ids[0].split()

        for message_id in message_ids:
            typ, msg_data = imap_server.fetch(message_id, '(RFC822)')
            if typ != "OK":
                print(f"Error fetching message ID {message_id}: {msg_data}")
                continue

            print(f"Message ID: {message_id}")
            # print(msg_data[0][1])
            print("-" * 40)

    except imaplib.IMAP4.error as e:
        print(f"Error while fetching emails from {mailbox}: {e}")

# Establish a secure SSL connection to the IMAP server
imap_server = imaplib.IMAP4_SSL(SMTP_SERVER)

# Log in to the server using the provided email credentials
imap_server.login(FROM_EMAIL, FROM_PWD)


# _, mailbox_list = imap_server.list()

# print("JJJJ", mailbox_list)

# List of mailbox names you want to fetch emails from
mailbox_list = ['Sent', "INBOX",  "SENT", "SPAM", "TRASH", "JUNK"]
mailbox_list = ["INBOX", "Sent", "Drafts", "Deleted Messages"]
mailbox_list = ["INBOX", "Sent",]

# Iterate through each mailbox and fetch emails
for mailbox in mailbox_list:
    fetch_emails_from_mailbox(imap_server, mailbox)

# Close the IMAP connection
imap_server.logout()
