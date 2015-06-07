angular.module('Inputable',[])
.controller('TryCtrl',function($scope, $sce){
    $scope.inputable = function(input){
        $scope.results = Inputable.in(input)
    }
})