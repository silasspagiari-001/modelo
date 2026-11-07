Ext.define('Overrides.picker.Date', {
    override: 'Ext.picker.Date',

    todayText: 'Hoje',

    ariaTitle: 'Calendário: {0}',
    
    minText: 'Esta data é anterior à data mínima',
    ariaMinText: "Esta data é anterior à data mínima",
    maxText: 'Esta data é posterior à data mínima',
    ariaMaxText: "Esta data é posterior à data mínima",
    disabledDaysText: 'Desabilitado',
    ariaDisabledDaysText: "Este dia da semana está desabilitado",
    disabledDatesText: 'Desabilitado',
    ariaDisabledDatesText: "Esta data esta desabilitada",
    nextText: 'Próximo Mês (Ctrl + Seta Direita)',
    prevText: 'Mês Anterior (Ctrl + Seta Esquerda)',
    monthYearText: 'Escolha um mês (Ctrl + Seta Cima/Baixo para navegar)'
});