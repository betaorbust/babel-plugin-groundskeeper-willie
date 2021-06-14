module.exports = {
    prodCode: {
        crew: ['Leela', 'Fry', 'Bender']
    } //<inObjectPragma>
    , testCode: {
        ships: ['Planet Express', 'Crushinator']
    }
    //</inObjectPragma>
};
module.exports.someArrayValues = ['Nibbler does', /*<inlinePragma>*/'not',/*</inlinePragma>*/ 'eat kittens'];
module.exports.someOtherThings = [ //<crossLinePragma>
    'If you read this, you\'ll get the clamps' //</crossLinePragma>
];
