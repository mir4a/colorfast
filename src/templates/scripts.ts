function createLinkList(text: string): string {
  var textArr = text.split("\\n");
  var tmp = "";

  for (var i = 0, len = textArr.length; i < len; i++) {
    tmp += "<a href=\"#" + textArr[i] + "\" class=\"xray-link\">" + textArr[i] + "</a><br>";
  }

  return tmp;
}

function xrayHandler(path: string): void {
  var xhr = new XMLHttpRequest();

  xhr.open("GET", "${xrayUrl}" + path, false);
  xhr.send();
  if (xhr.status != 200) {
    console.error(xhr.status, xhr.statusText);
  } else {
    console.log(xhr.responseText);
  }
}

function toggleModal(e: MouseEvent): void {
  console.log(e);
  var modal: HTMLElement = document.getElementById("modal")!; // eslint-disable-line  @typescript-eslint/no-non-null-assertion
  var modalContent: HTMLElement = document.getElementById("modal-content")!; // eslint-disable-line  @typescript-eslint/no-non-null-assertion
  var modalTitle: HTMLElement = document.getElementById("modal-title")!; // eslint-disable-line  @typescript-eslint/no-non-null-assertion
  var target = (e.target as HTMLAnchorElement);
  var title = target.title;
  var bg;

  if (target.id === "close") {
    modal.style.display = "none";
    modal.style.background = "rgba(250,250,250,0.95)";
  } else if (target.className === "color") {
    bg = target.style.background;
    modalContent.innerHTML = createLinkList(title);
    modal.style.display = "block";
    modal.style.background = bg;
    modal.style.boxShadow = "0 12px 110px " + bg;
    modalTitle.innerText = target.getElementsByTagName("b")[0].innerText;
  } else if (target.className === "xray-link") {
    xrayHandler(target.text);
  } else {
    modal.style.display = "block";
  }
}

function escHandler(e: KeyboardEvent): void {
  var modal = document.getElementById("modal")!; // eslint-disable-line  @typescript-eslint/no-non-null-assertion

  console.log(e);

  if (e.keyCode === 27) {
    modal.style.display = "none";
  }
}

document.addEventListener("click", toggleModal);
document.addEventListener("keyup", escHandler);
