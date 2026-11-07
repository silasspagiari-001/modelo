Ext.define('SamosAdmin.movimentos.ordenseleve.fotos.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.fotosordenseleve',

    onSairClick: async function(){
        this.getView().destroy();
    },

    onVisualizarClick: async function(){
        const view  = this.getView(),
              vm    = this.getViewModel(),
              model = view.modelOrdensVeiculo,
              grid = view.lookupReference('gridfotosordenseleve'),
              fotoSelecionada = grid.getSelection() ? grid.getSelection()[0] : null;

        if(!fotoSelecionada){
            Ext.Note('warning', 'Selecione uma foto.');
            return;
        }

        const preview = Ext.create('SamosAdmin.movimentos.ordenseleve.fotos.preview.View');
        preview.getViewModel().set({
            'fotoSelecionada': fotoSelecionada,
            'modelOrdensVeiculo' : model
        })

        Ext.defer( ()=>{
            preview.getController().onCarregarFoto();
            preview.setTitle(`Foto - ${fotoSelecionada.get('FOTOS_NOME')}`);
        }, 100, this );
    },

    onBuscarClick: async function(){
        const view  = this.getView(),
              vm    = this.getViewModel(),
              model = view.modelOrdensVeiculo,
              grid = view.lookupReference('gridfotosordenseleve');

        /*** COM AJAX ***/
        const respostaAjax = await $.ajax({
            method: 'GET',
            type: 'GET',
            headers: {
                "Content-Type"    : "application/json",
                "x-access-token"  : localStorage.SamosAdminUserToken
            },
            url: `${configs._apiNode}/processos/listarfotos`,
            data: { 
                subpasta  : `fotosordenseleve/${ model.get('ORDENS_ID') }`
            },
            cache: false,
            success: function(response) {

            },
            error: function(xhr) {
                
            }
        });

        const resultsFotos = respostaAjax.results;
        grid.getStore().add(resultsFotos);
    },

    onNovaClick: async function(){
        const view  = this.getView(),
              vm    = this.getViewModel(),
              model = view.modelOrdensVeiculo,
              grid = view.lookupReference('gridfotosordenseleve');

        const dialogFoto = new SamosWidgets.Photo();
        dialogFoto.onAposGravarFoto = async function( fotoView, base64 ) {
            const timestamp = SamosUtils.String.gerarTimestamp();
            const momentTimestamp = moment(timestamp);

            /*** COM FETCH ***/
            const data = {
                nomeArquivo   : timestamp,
                //Converte antes de enviar
                base64        : base64,
                subpasta      : `fotosordenseleve/${ model.get('ORDENS_ID') }`
            };

            const consulta = await fetch(`${configs._apiNode}/processos/gravafoto`, {
                method: 'POST',
                headers: {
                  "Content-Type"    : "application/json",
                  "x-access-token"  : localStorage.SamosAdminUserToken
                },
                body: JSON.stringify(data),
            });

            Ext.Note('success', 'Foto gravada com sucesso!');
            grid.getStore().add( {
                'FOTOS_NOME'     : data.nomeArquivo + '.jpeg',
                'FOTOS_EXTENSAO' : 'jpeg',
                'FOTOS_DATA'     : momentTimestamp.format('YYYY-MM-DD'),
                'FOTOS_HORA'     : momentTimestamp.format('hh:mm:ss')
            } );
        }
    },

    onDownloadClick: async function(){
        const view = this.getView(),
              vm   = this.getViewModel();
    }
});