document.addEventListener('DOMContentLoaded', function() {

	// Use buttons to toggle between views
	document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
	document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
	document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
	document.querySelector('#compose').addEventListener('click', compose_email);

	// Make submit button responsive
	document.querySelector("#compose-form").addEventListener('submit', send_email);

	// By default, load the inbox
	load_mailbox('inbox');
});

function compose_email() {

	// Show compose view and hide other views
	document.querySelector('#emails-view').style.display = 'none';
	document.querySelector('#compose-view').style.display = 'block';
	document.querySelector('#detail-view').style.display = 'none';

	// Clear out composition fields
	document.querySelector('#compose-recipients').value = '';
	document.querySelector('#compose-subject').value = '';
	document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
	// Show the mailbox and hide other views
	document.querySelector('#emails-view').style.display = 'block';
	document.querySelector('#compose-view').style.display = 'none';
	document.querySelector('#detail-view').style.display = 'none';


	// Show the mailbox name
	document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

	// Show Inbox
	fetch(`/emails/${mailbox}`)
	.then(response => response.json())
	.then(emails => {

		emails.forEach(email => {

			// Go over emails array and display each
			const emailElement = document.createElement('div');
			emailElement.classList.add('border', 'rounded', 'p-3', 'mb-3' );
			emailElement.innerHTML = `
				<h5>Sender: ${email.sender}</h5>
				<h4>Subject: ${email.subject}</h4>
				<p>${email.timestamp}</p>
			`;

			// Make each email to go to its own detailed page
			emailElement.addEventListener("click", function() {
				view_email(email.id)});

			// Set background color based on email.read value
			emailElement.style.backgroundColor = email.read ? 'lightgray' : 'white';

			// Add email view to page
			document.querySelector('#emails-view').append(emailElement);

		});
	    // Print emails
	    console.log(emails);
	});
}


function send_email() {

	// Store values from form
	const recipients = document.querySelector('#compose-recipients').value;
	const subject = document.querySelector('#compose-subject').value;
	const body = document.querySelector('#compose-body').value;

	// Fetch data to send
	fetch('/emails', {
		method: 'POST',
		body: JSON.stringify({
			recipients: recipients,
			subject: subject,
			body: body,
		})
	  })
	  .then(response => response.json())
	  .then(result => {
		  // Print result
		  console.log(result);
		  load_mailbox("sent")
	  });
}


function view_email(id) {
	fetch(`/emails/${id}`)
	.then(response => response.json())
	.then(email => {

		// Hide other stuff
		document.querySelector('#emails-view').style.display = 'none';
		document.querySelector('#compose-view').style.display = 'none';
		document.querySelector('#detail-view').style.display = 'block';

		// Display email
		document.querySelector('#detail-view').innerHTML = `
    		<ul class="list-group">
        		<li class="list-group-item"><b>From:</b> <span>${email['sender']}</span></li>
        		<li class="list-group-item"><b>To: </b><span>${email['recipients']}</span></li>
        		<li class="list-group-item"><b>Subject:</b> <span>${email['subject']}</span</li>
        		<li class="list-group-item"><b>Time:</b> <span>${email['timestamp']}</span></li>
        		<li class="list-group-item"><br/>${email['body']}</li>
      		</ul>
    	`;

		// Update if read
		if(email.read === false) {
			fetch(`/emails/${email.id}`, {
				method: 'PUT',
				body: JSON.stringify({
					read: true,
				})
			})
			.then(() => {
				console.log(email);
			});
		}

		// Add archive button
		const btn_archive = document.createElement('button');
		btn_archive.innerHTML = email.archived ? "Unarchive" : "Archive";
		btn_archive.id = "btn_archive";
		btn_archive.className = "btn btn-secondary m-3";
		btn_archive.addEventListener("click", function() {
			fetch(`/emails/${email.id}`, {
				method: 'PUT',
				body: JSON.stringify({
					archived: !email.archived,
				})
			})
			.then(() => {
				console.log(email)
				load_mailbox("inbox")
			});
		});

		// Append button to only Inbox and Archive views
		if(document.querySelector('#compose_sender').value !== email.sender){
			document.querySelector('#detail-view').append(btn_archive);
		}

		// Add reply button
		const btn_reply = document.createElement('button');
		btn_reply.innerHTML = "Reply";
		btn_reply.className = "btn btn-primary m-3"
		btn_reply.addEventListener("click", function () {
			compose_email();
			// Prefill the composition form
			document.querySelector('#compose-recipients').value = email.sender;
			if(email.subject.split(' ')[0] !== 'Re:')
				document.querySelector('#compose-subject').value = 'Re: ' + email.subject;
			else
				document.querySelector('#compose-subject').value = email.subject;
			document.querySelector('#compose-body').value = 'On ' + email.timestamp + ' ' + email.sender + ' wrote: '+ email.body;
		})
		document.querySelector('#detail-view').append(btn_reply);

	});
}