Ext.define('SamosAdmin.atualizacao.transportes.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formtransportes',

    //se apagar o CEP, sao sair do campo, ele limpar os dados do endereço automaticamente
    onSairCampoCep: function(campo, evento){
        const vm = this.getViewModel(),
              model = vm.get('model'),
              cepBuscando = campo.getRawValue().replace(/\D/ig, '');

        if( !vm.get('readOnly') && cepBuscando == '' ){
            //Limpa os campos pra evitar confusao
            model.set({
                'TRANSPORTES_ID_CIDADES' : '',
                'CIDADES_NOME'           : '',
                'CIDADES_ESTADO'         : '',
                'CIDADES_IBGE'           : '',
                'TRANSPORTES_ENDERECO'   : '',
                'TRANSPORTES_BAIRRO'     : ''
            });
        }
    }
});
