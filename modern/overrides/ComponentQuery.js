Ext.ComponentQuery.pseudos.editable = function(items) {
    var i = 0, 
        result = [];

    for (i in items) {
        if (items[i].getEditable()) {
            result.push(items[i]);
        }
    }
    return result;
};

Ext.$ = Ext.ComponentQuery.query;



Ext.Date.dayNames = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado"
];

Ext.Date.monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"
];

Ext.Date.defaultFormat = "d/m/Y";