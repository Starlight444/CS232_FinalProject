// sidebar
fetch('../components/student-sidebar/sidebar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('sidebar-placeholder').innerHTML = data;

        const script = document.createElement("script");
        script.src = "../components/student-sidebar/sidebar.js";
        document.body.appendChild(script);
    });

// navbar
fetch('../components/student-navbar/student-navbar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('navbar-placeholder').innerHTML = data;

        const script = document.createElement("script");
        script.src = "../components/student-navbar/student-navbar.js";
        document.body.appendChild(script);
    });
