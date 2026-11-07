Ext.define('SamosAdmin.consultas.precoproduto.ModelSaldos', {
    extend: 'Ext.data.NodeJSModel',
    fields: [
        'EMPRESAS_ID',
        'EMPRESAS_NOME',
        'SALDOS_DISPONIVEL',
        'SALDOS_RESERVADO',
        'SALDOS_COMPRADO',
        'SALDOS_PRECO',
        'SALDOS_PRAZO'
    ]
});
