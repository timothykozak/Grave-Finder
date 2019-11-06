// PBOcclusion.ts
//
// This class is used to handle a transparent div with text
// and an optional OK button that covers another div.
// If using as a simple occlusion then set textAndOK to true in the
// constructor.  Otherwise, the subclass needs to handle this.

class PBOcclusion {
    occlusionDiv: HTMLDivElement;   // This div is transparent, contains the other divs and starts out hidden.
    extraDiv: HTMLDivElement;       // Sits on top of the occlusionDiv so the text and button aren't transparent
    textDiv: HTMLDivElement;        // Text to display on the extraDiv.
    okButton: HTMLButtonElement;    // Optional OK button to cancel occlusion.
    activated: boolean = false;     // Remains false until activate is called.
                                    // If a subclass wants to do something on the first activation,
                                    // it needs to check this before calling the super.

    constructor(public occludedDiv: HTMLDivElement, public textAndOK = true) {
        this.initElements();
    }

    initElements() {
        this.occlusionDiv = document.createElement('div') as HTMLDivElement;
        this.occludedDiv.appendChild(this.occlusionDiv);
        this.occlusionDiv.className = 'occlusion-div';
        this.extraDiv = document.createElement('div');
        this.occludedDiv.appendChild(this.extraDiv);
        this.extraDiv.className = 'extra-div';
        if (this.textAndOK) {
            this.textDiv = document.createElement('div') as HTMLDivElement;
            this.extraDiv.appendChild(this.textDiv);
            this.textDiv.className = 'text-div';
            this.okButton = document.createElement('button');
            this.extraDiv.appendChild(this.okButton);
            this.okButton.className = 'ok-button';
            this.okButton.innerText = 'OK';
        } else {
            this.occlusionDiv.style.opacity = '1.0';
        }
    }

    activate(theText: string = '') {
        // This is called to show the occlusion.
        this.activated = true;
        this.occlusionDiv.style.display = 'block';
        this.extraDiv.style.display = 'block';
        this.setText(theText);
    }

    deactivate() {
        // Hide the occlusion.
        if (this.textAndOK) {
            this.okButton.style.display = 'none';
            this.textDiv.innerHTML = '';
        }
        this.extraDiv.style.display = 'none';
        this.occlusionDiv.style.display = 'none';
    }

    setText(theText: string) {
        if (this.textAndOK)
            this.textDiv.innerHTML = theText;
    }

    showOKButton() {
        if (this.textAndOK) {
            this.okButton.style.display = 'block';
            this.okButton.onclick = () => {
                this.deactivate();
            };
        }
    }


}

export {PBOcclusion};