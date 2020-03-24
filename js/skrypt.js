/*--------- ver7----------------*/
//metoda uruchamiana po załadowaniau treści strony
//wewnątrz tej metody uruchamiamy funkcję, w której 
//wykonywane są wszystkie operacje javaScript 
$().ready(function () {    
    var listaWszystkie = function (response) {
        $('#wszystkie').load('./templates/wszystkie_list.html', function (wczytanaTemplatka) {
            var output = Mustache.to_html(wczytanaTemplatka, response);
            $('#wszystkie').html(output);
            $('.wszystkie').children().each(function (index, element) {
                obslugaZdarzenWszystkie(element);
            });
        });
    }

    function zaladujWszystkie() {
        $.ajax({
            type: "GET",
            url: "http://localhost/wdAjax4/webservice/todo/",
            data: "{}",
            dataType: "json",
            success: listaWszystkie
        });
    }

    var listaNaDzien = function (response) {
        $('#nadzien').load('./templates/nadzien_list.html', function (wczytanaTemplatka) {
            var output = Mustache.to_html(wczytanaTemplatka, response);
            $('#nadzien').html(output);
            $('#nadzien').children().each(function (index, element) {
                obslugaZdarzenNaDzis(element);
            });
        });
    }

    function zaladujNaDzien() {
        let dzien = $('#dzien').val();
        //console.log(dzien);        
        if (isValidDate(dzien)) {
            $.ajax({
                type: "GET",
                url: "http://localhost/wdAjax4/webservice/todo/" + dzien,
                data: "{}",
                dataType: "json",
                success: listaNaDzien
            });
        }
    }

    function obslugaZdarzenWszystkie(sklonowany) {
        //dodajemy obsługę zdarzenia kliknięcia
        //na sklonowanym elemencie, które będzie miało
        //za zadanie przeniesienie elementu do listy na dziś 
        $(sklonowany).click(dodajDoDzis); 

        //przenosząc element do listy Do zrobienia
        //musimy zapewnić elementowi obsługę zdarzeń:
        // -najechania kursorem myszki na element
        $(sklonowany).mouseenter(wlaczWyroznienie);
        // -opuszczenia elementu przez kursor myszki 
        $(sklonowany).mouseleave(wylaczWyroznienie);

        //usuwamy atrybut draggable - przesuwanie
        //elementu działa tylko na liscie na dziś
        $(sklonowany).removeAttr("draggable");
        //przy przenoszeniu usuwamy wyróżnienie elementu
        $(sklonowany).removeClass('wyrozniony');
    }   

    function wlaczWyroznienie() {
        $(this).addClass('wyrozniony');
    }

    function wylaczWyroznienie() {
        $(this).removeClass('wyrozniony');
    }    

    function obslugaZdarzenNaDzis(sklonowany) {
        //do przeniesionego elementu dopisujemy
        //obsługę zdarzenia kliknięcia, która ma za zadanie
        //przenieść ten element z powrotem do listy wszystkich
        $(sklonowany).click(przeniesDoWszystkie);
        //przy przenoszeniu usuwamy wyróżnienie elementu
        $(sklonowany).removeClass('wyrozniony');
        $(sklonowany).attr("draggable", "true");
        $(sklonowany)
            //zdarzenie pozwalające na "złapanie" elementu listy
            .on("dragstart", function () {
                //zapamiętujemy przemieszczany element w source
                source = $(this);
            })
            //zdarzenie przemieszczania elementu nad innymi elementami
            .on("dragover", function (e) {
                //nie pozwalamy na standardową obsługę dragover
                //obsługa ta automatycznie "upuszcza" element
                e.preventDefault();
            })
            //zdarzenie reagujące na puszczenie lewgo klawisza myszki
            .on("drop", function () {
                //wstawiamy zapamiętany element source przed elementem,
                //nad którym jest kursor myszki $(this)                
                let zadanie_id = $(source).attr('data-id');
                let numer = $(this).index() + 1;
                zmienKolejnosc(zadanie_id, numer);
                $(this).before(source);
            });

        //przenosząc element do listy Do zrobienia
        //musimy zapewnić elementowi obsługę zdarzeń:
        // -najechania kursorem myszki na element
        $(sklonowany).mouseenter(wlaczWyroznienie);
        // -opuszczenia elementu przez kursor myszki 
        $(sklonowany).mouseleave(wylaczWyroznienie);
    }
    
    function isValidDate(dzien) {
        let d = new Date(dzien);
        return d instanceof Date && !isNaN(d);
    }

    var dodanoNoweZadanie = function (response) {        
        //tworzymy nowy element listy
        let zadanie = $('<li data-id="' + response.todo_id + '">' + response.todo_zadanie + '</li>');        
        //musimy zapewnić elementowi obsługę zdarzeń:        
        // -najechania kursorem myszki na element
        $(zadanie).mouseenter(wlaczWyroznienie);
        // -opuszczenia elementu przez kursor myszki 
        $(zadanie).mouseleave(wylaczWyroznienie);
        
        //obsługa kliknięcia na dopisanym elemencie  
        $(zadanie).click(dodajDoDzis);

        //dpisujemy nowy element do listy
        $('.wszystkie').append(zadanie);
        //czyścimy pole edycyjne
        $('#nowezadanie').val('');
    }

    function dopiszDoWszystkie() {
        //odczytujemy treść wprowadzoną w polu input id=nowezadanie
        let noweZadanie = $('#nowezadanie').val();
        //sprawdzamy czy nie wprowadzono samych spacji
        //czy długość napisu nie jest pusta
        if (noweZadanie.trim().length > 0) {
            $.ajax({
                type: "POST",
                url: "http://localhost/wdAjax4/webservice/todo/",
                data: { "todo_zadanie": noweZadanie },
                dataType: "json",
                success: dodanoNoweZadanie,
                error: function (response) {
                    alert("Błąd -> Dodawanie zadania: " + response);
                }
            });
        }
    }

    var przeniesionoNaDzien = function (response) {
        let todo_id = response.todo_id;
        let zadanie = $('[data-id="' + todo_id + '"]');
        //klonujemy zadanie

        let sklonowany = $(zadanie).clone();
        //sklonowany element dołączamy do listy na dziś
        $('.nadzien').append(sklonowany);
        //usuwamy zadanie z listy wszystkich
        $(zadanie).remove();
        obslugaZdarzenNaDzis(sklonowany);
        //alert("Przeniesiono zadanie na dzien" + response);
    }

    function przeniesNaDzien(zadanie_id, dzien) {
        $.ajax({
            type: "POST",
            url: "http://localhost/wdAjax4/webservice/",
            data: { "operacja": "naDzien", "todo_id": zadanie_id, "todo_data": dzien },
            dataType: "json",
            success: przeniesionoNaDzien,
            error: function (response) {
                alert("Błąd -> Przenoszenie na dzien: " + response);
            }
        });
    }

    //funkcja przenosi kliknięte zadanie
    //z listy wszystkich do listy na dziś
    function dodajDoDzis(e) {   
        if (e.altKey) {
            usunZWszystkie($(this));
            $('#nowezadanie').val('');
        } else if (e.ctrlKey) {
            let tresc=$(this).text();
            usunZWszystkie($(this));
            $('#nowezadanie').val(tresc);
        } else {     
            //odczytujemy datę z <input id="dzien">
            let dzien = $('#dzien').val();
            let zadanie_id = $(this).attr('data-id');
            przeniesNaDzien(zadanie_id, dzien);        
        }
    }

    var przeniesionoDoWszystkie = function (response) {
        let todo_id = response.todo_id;
        let zadanie = $('[data-id="' + todo_id + '"]');
        //klonujemy zadanie

        //klonujemy kliknięty element        
        let sklonowany = $(zadanie).clone();
        //usuwamy kliknięty element z listy na dziś
        $(zadanie).remove();
        //dopisujemy sklonowany element do listy .wszystkie
        $('.wszystkie').append(sklonowany);
        obslugaZdarzenWszystkie(sklonowany);
        //alert("Przeniesiono zadanie do Wszystkie" + response);
    }

    function przeniesDoWszystkie() {
        let zadanie_id = $(this).attr('data-id');        
        $.ajax({
            type: "POST",
            url: "http://localhost/wdAjax4/webservice/",
            data: { "operacja": "doWszystkie", "todo_id": zadanie_id },
            dataType: "json",
            success: przeniesionoDoWszystkie,
            error: function (response) {
                alert("Błąd -> Przenoszenie do wszystkie: " + response);
            }
        });
    }

    var zmienionoKolejnosc = function (response) {
        let todo_id = response.todo_id;
        let zadanie = $('[data-id="' + todo_id + '"]');
        //klonujemy zadanie
        /*
        //klonujemy kliknięty element        
        let sklonowany = $(zadanie).clone();
        //usuwamy kliknięty element z listy na dziś
        $(zadanie).remove();                
        //dopisujemy sklonowany element do listy .wszystkie
        $('.wszystkie').append(sklonowany);
        obslugaZdarzenWszystkie(sklonowany);
        */
        //alert("Przeniesiono zadanie do Wszystkie" + response);
    }

    function zmienKolejnosc(zadanie_id, numer) {
        $.ajax({
            type: "POST",
            url: "http://localhost/wdAjax4/webservice/",
            data: { "operacja": "zmienKolejnosc", "todo_id": zadanie_id, "todo_nr": numer },
            dataType: "json",
            success: zmienionoKolejnosc,
            error: function (response) {
                alert("Błąd -> Zmiana kolejności: " + response);
            }
        });
    }

    var usunietoZadanie = function(response){
        let todo_id = response.todo_id;
        let zadanie = $('[data-id="'+todo_id+'"]');
        //odczytujemy treść klikniętego zadania
        let trescZadania = $(zadanie).text();
        //treść wklejamy do pola edycyjnego
        $('#nowezadanie').val(trescZadania);
        //usuwamy zadanie z listy
        $(zadanie).remove();   
        //alert("Usunieto zadanie" + response);
    }

    function usunZWszystkie(zadanie){
		//odczytujemy id kliknietego zadania
        let zadanie_id = $(zadanie).attr('data-id');
        $.ajax({
            type: "GET",
            url: "http://localhost/wdAjax4/webservice/delete/"+zadanie_id,
            data: {},
            dataType: "json",
            success: usunietoZadanie,
            error: function (response) {
                alert("Błąd -> Usuwanie zadania: " + response);
            }
        });
    }

    var usunietoZadanie = function(response){
        let todo_id = response.todo_id;
        let zadanie = $('[data-id="'+todo_id+'"]');
        //odczytujemy treść klikniętego zadania
        let trescZadania = $(zadanie).text();
        //treść wklejamy do pola edycyjnego
        $('#nowezadanie').val(trescZadania);
        //usuwamy zadanie z listy
        $(zadanie).remove();   
        //alert("Usunieto zadanie" + response);
    }

    function usunZWszystkie(zadanie){
        //odczytujemy id kliknietego zadania
        let zadanie_id = $(zadanie).attr('data-id');
        $.ajax({
            type: "GET",
            url: "http://localhost/wdAjax4/webservice/delete/"+zadanie_id,
            data: {},
            dataType: "json",
            success: usunietoZadanie,
            error: function (response) {
                alert("Błąd -> Usuwanie zadania: " + response);
            }
        });
    }


    $('#dzien').val(new Date().toISOString().slice(0, 10));
    zaladujWszystkie();
    zaladujNaDzien();
    //do przycisku oznaczonego id=dopisz dodajemy obsługę
    //zdarzenia dopisania nowego zadania do listy
    $('#dopisz').click(dopiszDoWszystkie);    

    //zmienna pomocnicza do przechowywania
    //przesuwanego zadania
    let source;
});
