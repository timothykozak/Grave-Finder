// PBOcclusion.ts
//
//  This class is used to handle a transparent div with text
// and an optional OK button that covers another div.

class PBOcclusion {
    occlusionDiv: HTMLDivElement;   // This div is transparent, contains the other divs and starts out hidden.
    extraDiv: HTMLDivElement;       // Sits on top of the occlusionDiv so the text and button aren't transparent
    textDiv: HTMLDivElement;      // Text to display on the extraDiv.
    okButton: HTMLButtonElement;    // Optional OK button to cancel occlusion.

    constructor(public occludedDiv: HTMLDivElement) {
        this.initElements();
    }

    initElements() {
        this.occlusionDiv = document.createElement('div') as HTMLDivElement;
        this.occludedDiv.appendChild(this.occlusionDiv);
        this.occlusionDiv.className = 'occlusion-div';
        this.extraDiv = document.createElement('div');
        this.occludedDiv.appendChild(this.extraDiv);
        this.extraDiv.className = 'extra-div';
        this.textDiv = document.createElement('div') as HTMLDivElement;
        this.extraDiv.appendChild(this.textDiv);
        this.textDiv.className = 'text-div';
        this.okButton = document.createElement('button');
        this.extraDiv.appendChild(this.okButton);
        this.okButton.className = 'ok-button';
        this.okButton.innerText = 'OK';
    }

    activate(theText: string) {
        this.occlusionDiv.style.display = 'block';
        this.extraDiv.style.display = 'block';
        this.setText(theText);
    }

    setText(theText: string) {
        this.textDiv.innerHTML = theText;
    }

    showOKButton() {
        this.okButton.style.display = 'block';
        this.okButton.onclick = () => {
            this.extraDiv.style.display = 'none';
            this.okButton.style.display = 'none';
            this.textDiv.innerHTML = '';
            this.occlusionDiv.style.display = 'none';
        }
    };


}

export {PBOcclusion};