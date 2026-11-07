Ext.define('SamosAdmin.movimentos.movimento.form.sefaz.Model', {
    extend: 'Ext.data.NodeJSModel',

    fields: [
        {
            name: 'Ambiente',
            mapping: 'AMBIENTE'
        },
        {
            name: 'Empresa',
            mapping: 'EMPRESAS_ID'
        },
        {
            name: 'Número',
            mapping: 'NUMERO'
        },
        {
            name: 'Série',
            mapping: 'SERIE'
        },
        {
            name: 'Valor',
            mapping: 'VALOR',
            convert: function(value, record) {
                return Ext.util.Format.maskRenderer('R$ #9.990,00', true)(value);
            }
        },
        {
            name: 'Status',
            mapping: 'STATUS'
        },
        {
            name: 'Protocolo',
            mapping: 'PROTOCOLO'
        },
        {
            name: 'Nfe',
            mapping: 'NFE'
        },
        {
            name: 'Cfe',
            mapping: 'CFE'
        },
        {
            name: 'Controle',
            mapping: 'NOME'
        },
        {
            name: 'Faturado',
            mapping: 'ENTRADASAIDA'
        },
        {
            name: 'Emissão',
            mapping: 'EMISSAO',
            convert: function(value, record) {
                return momentTz(value).format('DD/MM/YYYY');
            }
        },
        {
            name: 'Hora',
            mapping: 'HORA'
        },
       'CAMINHO',
       'RETORNO'
    ]
});
