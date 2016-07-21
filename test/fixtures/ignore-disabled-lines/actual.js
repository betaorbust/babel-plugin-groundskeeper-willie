let name = 'Fry';
let otherName = 'Leela';
let evenOtherName = 'Amy';
(()=>{let foo = name; console.log(foo);})()
(()=>{let foo = name; console.log(foo);})() // groundskeeper-willie-disable-line
console.log(`Hi ${ name }`);
console.log(`Hi ${ otherName }`); // groundskeeper-willie-disable-line
console.log(`Hi ${ evenOtherName }`); /* groundskeeper-disable-line*/
console.warn(`Hi ${ name }`);
console.warn(`Hi ${ otherName }`); // groundskeeper-willie-disable-line
console.warn(`Hi ${ evenOtherName }`); // groundskeeper-disable-line
console.error(`Hi ${ name }`);
console.error(`Hi ${ otherName }`); // groundskeeper-willie-disable-line
console.error(`Hi ${ evenOtherName }`); // groundskeeper-disable-line
