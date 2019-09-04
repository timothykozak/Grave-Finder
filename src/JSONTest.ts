
interface Int {
    x1: number,
    s1: string,
    a1: Array<boolean>
}


let obj1 = {
    obj1Array: [1, 3, 5, 7],
    obj1String: "This is x1",
    obj1Number: 42,
    toJSON(key: any) {
        if (typeof(key) === 'number')
            return `The number is ${key}`;
        else
            return this;
    }
};

let obj2 = {
    obj2Obj1: obj1,
    toJSON(key: any) {
        // if (key)
        //     return `Now I am a nested object under key '${key}'`;
        // else
        return this;
    }
};

function runJSON() {
    console.log("\nStringify:\n");
    console.log(JSON.stringify(obj2));
    console.log("\n\nKeys:\n");
    console.log(Object.keys(obj1));
    console.log(Object.keys(obj2));
}

