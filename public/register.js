// register.js

document
  .getElementById("register-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent the default form submission

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // Basic input validation
    if (!username || !email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, username, password }),
        credentials: "include", // Optional, only if you are using cookies
      });

      const data = await response.json(); // Parse the JSON response

      if (response.ok) {
        // Registration was successful
        alert("Registration successful!");
        window.location.href = "/login"; // Redirect to the login page
      } else {
        // If response is not ok, show the error message
        alert(`Registration failed: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      alert(`Caught an error: ${error.message}`);
    }
  });
