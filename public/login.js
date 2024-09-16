document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("login-form");

  // Handle login form submission
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the default form submission

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (username === "" || password === "") {
      alert("Please fill in both username and password.");
      return; // Stop further execution if validation fails
    }

    // Create an object with the form data
    const formData = {
      username: username,
      password: password,
    };

    // Send the form data to the backend using fetch
    fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.error || "Login failed");
          });
        }
        return response.json();
      })
      .then((data) => {
        alert("Login successful!");
        // Redirect or perform other actions upon successful login
        window.location.href = "/dashboard"; // Redirect to dashboard
      })
      .catch((error) => {
        console.error("Error:", error);
        alert(`An error occurred: ${error.message}`); // Fixed syntax error
      });
  });
});
