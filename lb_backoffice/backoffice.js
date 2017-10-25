
// TODO le faire en 2 phases :
// 1 - importer un nouveau mois (ou supprimer ou remplacer)
// 2 - générer le json final pour une periode donnée (reparsing des tableurs ou generation json ?) => storage du csv raw quand même pour futur récuération / si errors

var repositoryEndPoint = window.location.hostname == "localhost" ? "http://localhost:4567" : "http://localhost:6666" // TODO put github URL !
var repositoryOwner = "labibliotheque"
var repositoryName = "CBN_2017"

// TODO utiliser les data calculer comme check sum plutôt que se baser dessus !

// TODO calculer le "top-emplacement"

var currentContent = null
var currentMonth = null



function ghConnect(event){

    // TODO refactor this
    var ghUsername = $('#gh-login').val()
    var ghPassword = $('#gh-pwd').val()

    $.ajax({
        type: "GET",
        url: repositoryEndPoint + "/user",
        beforeSend: function (xhr) {
            xhr.setRequestHeader ("Authorization", "Basic " + btoa(ghUsername + ":" + ghPassword));
        },
        success: function(data, status, xhr){
            // TODO gui success massage and display other GUI
            console.log(status)
            console.log(data)
        },
        error: function(xhr, status, message){
            // TODO gui error message
            console.log(message)
        }
    });

}

function push_data(event){

    var ghUsername = $('#gh-login').val()
    var ghPassword = $('#gh-pwd').val()

    var yy = "17"
    var mm = "11"

    var path = "data/CBN_pretsjour_bibempl_" + yy + mm + ".json"

    var content = {
        field1: 45,
        field2: "toto"
    }

    content = currentContent

    var data = {
        message: "the commit message",
        content: btoa(JSON.stringify(content, null, "  "))
    }

    $.ajax({
        type: "PUT",
        url: repositoryEndPoint + "/repos/" + repositoryOwner + "/" + repositoryName + "/contents/" + path,
        contentType: "application/json",
        data: JSON.stringify(data),
        beforeSend: function (xhr) {
            xhr.setRequestHeader ("Authorization", "Basic " + btoa(ghUsername + ":" + ghPassword));
        }
    });

}

$(function(){
   


    $("#tainput").on('paste', function(event) {

        event.preventDefault();
        var text = null;
        if (window.clipboardData) 
          text = window.clipboardData.getData("Text");
        else if (event.originalEvent && event.originalEvent.clipboardData)
          text = event.originalEvent.clipboardData.getData("Text");


        // console.log(text)

        parse_raw_data(text)
    });


});




function parse_raw_data(data){

    var matrix = $.csv.toArrays(data, {separator: "\t"});
    console.log(matrix)

    var r = "<table>"

    for(var i in matrix){

        line = matrix[i]
        r += "<tr>"
        for(var j in line){
            var cell = line[j]
            r += "<td>" + cell + "</td>"
        }
        r += "</tr>"
    }
    r += "</table>"

    $('#debug').replaceWith(r)


    // scrap

    // parse column header

    jsonMax = {}
    json = [jsonMax]

    regexp_date = /.*(\d{2})\/(\d{2})\/(\d{2})/i

    var dayMax = 0

    for(var col = 2 ; col < matrix[0].length ; col++){

        var cell = matrix[0][col]

        // convert from dd/mm/yy to mm/dd/yyyy
        var elements = regexp_date.exec(cell)

        var day = parseInt(elements[1])
        var mon = parseInt(elements[2])
        var year = parseInt(elements[3])

        var jsonDate = mon + "/" + day + "/20" + year

        console.log(elements)
        console.log(jsonDate)

        json.push({date: jsonDate})

        dayMax = day > dayMax ? day : dayMax
    }

    var location = null

    // parse row header

    // TODO fill missing days by zeros .... donc deja parser toutes les categories possibles

    for(var row=1 ; row < matrix.length ; row++){

        var locCell = matrix[row][0].trim()
        if(locCell.length > 0) location = locCell

        if(location == null) throw new Error("ligne 1 / colonne 1 ne doit pas être vide ...")

        var category = matrix[row][1].trim().toLowerCase()
        if(row == 1){
            if(category.length != 0) throw new Error("ligne 1 / colonne 2 doit être vide ...")
        }else{
            if(category.length == 0) throw new Error("ligne " + (row+1) + " / colonne 2 ne doit pas être vide ...")
        }

        // parse content ... 

        for(var col = 2 ; col < matrix[row].length ; col++){

            var cell = matrix[row][col]

            var count = parseInt(cell)

            var jsonDay = json[col-1]

            var jsonLocation = jsonDay[location] || (jsonDay[location] = {})

            jsonLocation[category] = count

            // update max for current category
            var maxLabel = "Max_" + category
            var max = (jsonMax[maxLabel]||0)
            jsonMax[maxLabel] = max < count ? count : max

            // update global max
            var maxLabel = "Max"
            var max = (jsonMax[maxLabel]||0)
            jsonMax[maxLabel] = max < count ? count : max
        }

    }


    console.log(json)

    jsonString = JSON.stringify(json, null, "    ")

    currentContent = json

    console.log(jsonString)
}