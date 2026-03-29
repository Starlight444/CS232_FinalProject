// eye-off switch
function togglePw() {
  const pw = document.getElementById('pw');
  const eyeOpen = document.querySelector('.mdi-light--eye');
  const eyeOff = document.querySelector('.mdi-light--eye-off');

  if (pw.type === 'password') {
    pw.type = 'text';
    eyeOpen.style.display = 'inline-block';
    eyeOff.style.display = 'none';
  } else {
    pw.type = 'password';
    eyeOpen.style.display = 'none';
    eyeOff.style.display = 'inline-block';
  }
}

// call login API
async function handleLogin() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("pw").value;

  try {
       const res = await fetch("/users/login", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ email, password }),
     });

    if (res.ok) {
        const { data } = await res.json();
        localStorage.setItem("user", JSON.stringify(data));
        // data = { token, user_id, email, first_name, last_name, role }

        if (data.role === "teacher") {
            window.location.href = "../teacher/teacher-dashboard.html";
        } else if (data.role === "student") {
            window.location.href = "../student/home.html";
        }
    } else {
        const data = await res.json();
        console.error("Login failed:", data.message);

        const el = document.getElementById("error-text");
        el.textContent = data.message;
        el.style.visibility = "visible";
    }
  } catch (err) {
    console.error("Network error:", err);
    alert("Something wrong, please try again.");
  }
}