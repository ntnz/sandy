window.addEventListener("load", () => {
  const form = document.getElementById("contact-form");
  const notification = document.getElementById("form-notification");

  if (!form || !notification) return;

  const button = form.querySelector('button[type="submit"]');
  const buttonLabel = button.textContent;
  let hideTimeout;

  const showNotification = (message, isError) => {
    clearTimeout(hideTimeout);
    notification.textContent = message;
    notification.classList.toggle("form-notification--error", isError);
    notification.classList.add("form-notification--visible");

    hideTimeout = setTimeout(() => {
      notification.classList.remove("form-notification--visible");
    }, 6000);
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    button.disabled = true;
    button.textContent = "sending";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });

      if (!response.ok) throw new Error(response.status);

      form.reset();
      showNotification("Thanks, your message is on its way.", false);
    } catch {
      showNotification(
        "Something went wrong. Please email sandy@sandyhughes.co instead.",
        true,
      );
    } finally {
      button.disabled = false;
      button.textContent = buttonLabel;
    }
  });
});
