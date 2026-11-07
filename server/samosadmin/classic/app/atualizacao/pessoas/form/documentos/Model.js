Ext.define('SamosAdmin.atualizacao.pessoas.form.documentos.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'PESSOASDOCUMENTOS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/pessoasdocumentos'
    },
    
    fields: [
        'PESSOASDOCUMENTOS_ID',
        'PESSOASDOCUMENTOS_ID_PESSOAS',
        'PESSOASDOCUMENTOS_CAMINHO',
        'PESSOASDOCUMENTOS_EXTENSAO',
        'PESSOASDOCUMENTOS_NUMERO', 
        'PESSOASDOCUMENTOS_DOCUMENTO', 
        'PESSOASDOCUMENTOS_LOG', 
        {
            name: 'PESSOASDOCUMENTOS_INCLUSAO',
            type: 'nodejsdate'
        }, 
        {
            name: 'PESSOASDOCUMENTOS_VALIDADE',
            type: 'nodejsdate'
        }
    ]
});
