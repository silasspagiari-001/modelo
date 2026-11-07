Ext.define('SamosAdmin.atualizacao.veiculos.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'SERVICOS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/veiculos'
   },

    constructor: function () {
        this.defaultValues = {
            'SERVICOS_STATUS' : 'T',
            'SERVICOS_DESCRICAO': ''
       };
       this.callParent(arguments);
    },
    fields: [
        'SERVICOS_ID',
        {
            name: 'SERVICOS_STATUS',       ///  CHAR(1) NOT NULL
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'SERVICOS_CODIGO',
            validators: [
                {type: 'length', max: 20}
            ]
        },
        {
            name: 'SERVICOS_NOME',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },        
        {
            name: 'VEICULO_HORADIA', // Cobrança por hora ou por diária
            critical: true,
            validators: [
                {type: 'length', max: 1}
            ]
        },    
        {
            name: 'VEICULO_TIPO', // Munck, Guindaste, Frete, etc.
            critical: true,            
            validators: [
                {type: 'length', max: 10}
            ]
        },    
        {
            name: 'VEICULO_PLACA',
            critical: true,
            validators: [
                {type: 'length', max: 8}
            ]
        },    
        {
            name: 'VEICULO_RENAVAM',
            critical: true,            
            validators: [
                {type: 'length', max: 11}
            ]
        },        
        {
            name: 'VEICULO_ANOMODELO',
            critical: true,            
            validators: [
                {type: 'length', max: 9}
            ]
        },    
        {
            name: 'VEICULO_VHA', // Valor hora adicional
            critical: true
        },    
        {
            name: 'VEICULO_VSD', // Valor acréscimo sáb/dom/fer
            critical: true
        },    
        {
            name: 'SERVICOS_DESCRICAO',
            validators: [
                {type: 'length', max: 512}
            ]
        },
        {
            name: 'SERVICOS_ISS',        // NUMERIC(7, 3)
            validators: [
                {type: 'presence'}
            ]
        },        
        {
            name: 'SERVICOS_PRECO',     // NUMERIC(12, 2)
            validators: [
                {type: 'presence'}
            ]
        },        
    ]
});
