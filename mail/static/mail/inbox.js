document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', function() {
    // delete  [object PointerEvent]/pass empty string
    compose_email();
  });
  // By default, load the inbox
  load_mailbox('inbox');

  // SEND MAIL
  document.querySelector("#compose-form").addEventListener("submit", function(event) {
    event.preventDefault();

    const recipients = document.getElementById("compose-recipients").value;
    const subject = document.getElementById("compose-subject").value;
    const body = document.getElementById("compose-body").value;

    fetch("/emails", {
      method: "POST",
      body: JSON.stringify({
        recipients:recipients,
        subject:subject,
        body:body
      })
    })
    .then(response=>response.json())
    .then(data => {
      console.log(data);
      load_mailbox('sent');
    })
  })
});


function compose_email(recipients = '', subject = '', body = '') {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Pre-fill the composition fields
  document.querySelector('#compose-recipients').value = recipients;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3 class="text-2xl font-semibold text-left">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // TODO
  fetch(`emails/${mailbox}`)
  .then(response=>response.json())
  .then(emails => {

    emails.forEach(email => {

      const emailContainer = document.createElement("div");
      emailContainer.classList.add("email-container");

      const emailDiv = document.createElement("div");
      emailDiv.classList.add("email");

      // if email is read color is lightgray, if not white
      emailDiv.style.backgroundColor = email.read ? "#f5f5f5" : "white";
      emailDiv.style.border = "thin solid #f5f5f5";
      emailDiv.style.padding = "8px";
      emailDiv.style.margin = "16px";
      emailDiv.style.cursor = "pointer";
      emailDiv.style.borderRadius = "6px";
      emailDiv.style.width = "520px";

      if (mailbox === 'inbox' || mailbox === 'archive') {
        emailDiv.innerHTML = `
        <article>
          <div class="flex justify-between items-center">
              <div>
                <strong>${email.sender}</strong>
              </div>
              <div>
                <span class="email-subject">${email.subject}</span>
              </div>
              <div>
                <span class="email-timestamp text-sm font-thin">${email.timestamp}</span>
              </div>
          </div>
        </article>    
        `;
      } else if (mailbox === "sent") {
        emailDiv.innerHTML = `
        <article>
          <div class="flex justify-between items-center">
              <div>
                <strong>To: ${email.recipients}</strong>
              </div>
              <div>
                <span class="email-subject">${email.subject}</span>
              </div>
              <div>
                <span class="email-timestamp text-sm font-thin">${email.timestamp}</span>
              </div>
          </div>
        </article>    
        `;
      }

      emailContainer.appendChild(emailDiv);

      // GET SINGLE EMAIL (display_email and mark_as_read)
      function display_email(email) {
        console.log(email);
        document.getElementById("emails-view").innerHTML = '';
        const emailDetail = document.createElement("div");
        emailDetail.classList.add('email-detail')

        emailDetail.innerHTML = `
        <div>
          <strong>From:</strong> ${email.sender}<br>
          <strong>To:</strong> ${email.recipients.join(', ')}<br>
          <strong>Subject:</strong> ${email.subject}<br>
          <strong>Timestamp:</strong> ${email.timestamp}<br><br>
          <p>${email.body}</p>
        </div>
        <div class="reply-container">
          <button id="reply-btn" class="btn-reply">Reply</button>
        </div>
        `;

        // REPLY 
        const replyButton = emailDetail.querySelector("#reply-btn");
        replyButton.addEventListener("click", function (event) {
          event.preventDefault();
          compose_email(email.sender, `Re: ${email.subject}`, `On ${email.timestamp} ${email.sender} wrote:\n\n${email.body}`);
        });
      

        document.getElementById("emails-view").appendChild(emailDetail)
      };

      function mark_as_read(emailID) {
        fetch(`/emails/${emailID}`, {
          method: "PUT",
          body: JSON.stringify({
            read: true
          })
        })
          .then(response => {
            if (response.status === 204) {
              console.log("Email marked as read.");
            } else {
              console.log("Failed to mark email as read.");
            }
          })
      };

      emailDiv.addEventListener("click", function() {
        fetch(`/emails/${email.id}`)
          .then(response => response.json())
          .then(email => {
            display_email(email)
            mark_as_read(email.id)
            console.log();
          })
      })

      // ARCHIVE AND UNARCHIVE
      const archiveButtonContainer = document.createElement('div');
      archiveButtonContainer.classList.add('archive-button-container');

      const archiveButton = document.createElement('button')
      archiveButton.textContent = email.archived ? 'Unarchive' : 'Archive'
      archiveButton.classList.add('btn-arch')

      if (mailbox === 'inbox') {
        archiveButton.textContent = email.archived ? 'Unarchive' : 'Archive'
      } else if (mailbox === 'archive') {
        archiveButton.textContent = 'Unarchive';
      } else if (mailbox === 'sent') {
        archiveButton.style.display = 'none'
      }

      archiveButton.addEventListener('click', function() {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: !email.archived
          })
        })
          .then(response => {
            if (response.status === 204) {
              console.log("Email archived/unarchived successfully.");
              load_mailbox('inbox')
            } else {
              console.error('Failed to archive/unarchive email.');
            }
          })
      })

      archiveButtonContainer.appendChild(archiveButton);
      emailContainer.appendChild(archiveButtonContainer);
      document.getElementById("emails-view").appendChild(emailContainer);
    })
    console.log(emails);

  })
}

