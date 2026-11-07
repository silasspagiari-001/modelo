Ext.define('SamosAdmin.movimentos.ordensveiculos.fotos.preview.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.previewfotoordensveiculos',

    onSairClick: async function(){
        this.getView().destroy();
    },

    onCarregarFoto: async function(){
        const view = this.getView(),
              vm   = this.getViewModel(),
              fotoSelecionada = vm.get('fotoSelecionada'),
              displayImagemPreview = view.lookupReference('imagempreview'),
              modelOrdensVeiculo = vm.get('modelOrdensVeiculo');

        /*** CONSULTA BASe64 COM AJAX ***/
        const respostaAjax = await $.ajax({
            method: 'GET',
            type: 'GET',
            headers: {
                "Content-Type"    : "application/json",
                "x-access-token"  : localStorage.SamosAdminUserToken
            },
            url: `${configs._apiNode}/processos/getbase64foto`,
            data: { 
                subpasta  : `fotosordensveiculos/${ modelOrdensVeiculo.get('ORDENS_ID') }`,
                foto      : fotoSelecionada.get('FOTOS_NOME')
            },
            cache: false,
            success: function(response) {

            },
            error: function(xhr) {
                
            }
        });

        const resultsFoto = respostaAjax.results[0],
              base64 = resultsFoto['FOTOS_BASE64'];

        displayImagemPreview.setSrc( 'data:image/png;base64, ' + base64 );
    }
});