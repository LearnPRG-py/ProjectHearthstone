document.addEventListener("DOMContentLoaded", () => {
    fetch("faq.json")
        .then(response => response.json())
        .then(data => {
            const faqList = document.getElementById("faq-list");
            data["faq-list"].forEach(item => {
                
                const li = document.createElement("li");

                const button = document.createElement("button");
                button.addEventListener("click", () => {
                    const answer = button.nextElementSibling;
                    button.classList.toggle("active");
                    button.firstElementChild.classList.toggle("active");
                    answer.classList.toggle("active");
                    button.parentElement.classList.toggle("active");
                });
                button.classList.add("faq-btn");
                button.innerHTML = `
                    ${item.question}
                    <img class="arrow-icon"
                         src="https://www.svgrepo.com/show/102662/arrow-down-angle.svg"
                         alt="Down Arrow">
                `;

                const answerDiv = document.createElement("div");
                answerDiv.classList.add("faq-answer");
                answerDiv.innerHTML = `<p>${item.answer}</p>`;

                li.appendChild(button);
                li.appendChild(answerDiv);
                faqList.appendChild(li);
            });
        })
        .catch(error => console.error("Error loading FAQ:", error));
});
