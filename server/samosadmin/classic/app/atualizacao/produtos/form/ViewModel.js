Ext.define('SamosAdmin.atualizacao.produtos.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formprodutos',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({

            hideBtnBarras: function (get) {
                return configs.getClientName() != 'hospitalar' || 
                       get('readOnly') ||
                       get('model.PRODUTOS_BARRA') != '' ||
                       (parseInt(get('model.PRODUTOS_ID')) < 1);
            },

            hideReservado: function (get) {
                return configs.getClientName() == 'stilomoveis' || 
                       get('reservadoBiomart');
            },

            hideFotos: function (get) {
                return get('updating') ||
                       !configs.getProdutos().fotos
            },

            hideCstsubst: function(get) {
                return configs.getClientName() != 'biomart';
            },

            reservadoBiomart: function(get) {
                return configs.getClientName() == 'biomart' && !configs.getUsuario().id.toString().match(/1|4/);
            },

            grupoAssociations: function(get) {
                const grupoMoveis = configs.getClientName() == 'prudenmoveis';

                return grupoMoveis ? 
                    [
                        ['GRUPOS_NOME',             'GRUPOS_NOME'],
                        ['PRODUTOS_ID_GRUPOS',      'GRUPOS_ID'],
                        ['PERCENTUAL_COMISSAO',     'PERCENTUAL_COMISSAO'],
                        ['PERCENTUAL_MARGEM',       'PERCENTUAL_MARGEM'],
                        ['PERCENTUAL_MARGEMMINIMA', 'PERCENTUAL_MARGEMMINIMA'],
                    ] : [
                        ['GRUPOS_NOME',        'GRUPOS_NOME'],
                        ['PRODUTOS_ID_GRUPOS', 'GRUPOS_ID']
                    ];
            }

        });
    }


});
