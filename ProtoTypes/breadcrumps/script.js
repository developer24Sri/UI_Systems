const BreadCrumps = document.querySelector(".breadCrumps");
const currLocation = window.location.pathname.split("/").filter(page => page.endsWith(".html")).toString();

let breadsHistory = JSON.parse(sessionStorage.getItem("breads")) || [];

const existingIndex = breadsHistory.indexOf(currLocation);
if (existingIndex !== -1) {
    breadsHistory = breadsHistory.slice(0, existingIndex + 1);
} else {
    breadsHistory.push(currLocation);
}
//if you want you can keep it:
if (breadsHistory.length > 5) {
    breadsHistory = breadsHistory.slice(-5);
}

sessionStorage.setItem("breads", JSON.stringify(breadsHistory));
//it will have the recent page as the last one i.e if u r in the interiors then the last value in the arr is interiors.html

const labels = {
    "index": "Home",
    "interiors": "Interiors",
    "designs": "Designs"
};

breadsHistory.map(bread => {
    if (bread === breadsHistory.at(-1)) {
        const key = bread.replace(".html", "");
        const label = labels[key];
        BreadCrumps.innerHTML += `<span>${label}</span>`;
    } else {
        const key = bread.replace(".html", "");
        const label = labels[key];
        const divider = document.createElement("span");
        divider.innerText = " > ";
        BreadCrumps.innerHTML += `<a href="${bread}">${label}</a>>`;
    }
})


