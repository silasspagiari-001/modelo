Ext.define('SamosAdmin.movimentos.coletas.form.fotos.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formcoletasfotos',

    requires: [
        'SamosAdmin.movimentos.coletas.form.fotos.ViewModel',
        'SamosAdmin.movimentos.coletas.form.fotos.ViewController'
    ],

    title: 'Fotos',
    modelName: 'SamosAdmin.movimentos.coletas.form.fotos.Model',
    hidePaging: true,

    leftbuttons: [
        'Visualizar',
        'Baixar',
        'Excluir',
        'Carregar',
        {
            type: 'file',
            accept: '*/*',
            hidden: true,
            action: 'CarregarArquivo'
        }
    ],

    rightbuttons: [
        'Sair'
    ],

    constructor: function () {
        Ext.apply(this, {
            selModel: {
                selType: 'checkboxmodel',
                showHeaderCheckbox: true,
                mode: 'MULTI',
                checkOnly: true,
                injectCheckbox: 1
            },
            columns: [
                {
                    text: 'Nome',
                    dataIndex: 'COLETASFOTOS_DESCRICAO',
                    width: 120 // 180
                },
                {
                    text: 'Data',
                    dataIndex: 'COLETASFOTOS_LOG',
                    flex: 1
                }
            ],
            previewConfig: {
                xtype: 'panel',
                title: 'Pré-visualização',
                width: 450,
                split: false,
                collapsible: false, 
                margin: '0 0 0 5',
                bodyPadding: 10,
            
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
            
                items: [
                    {
                        xtype: 'image',
                        reference: 'previewImage',
                        flex: 1,
                        alt: 'Nenhuma imagem selecionada',
                        style: {
                            border: '1px solid #dcdcdc',
                            backgroundColor: '#fafafa',
                            objectFit: 'contain'                            
                        }
                    }
                ]
            },           
            gridListeners: {
                selectionChange: 'onSelectionChange'
            }
        });
        
        this.callParent(arguments);        
    }
});