<?php

    // Initialize variable for database credentials
    $dbhost = 'localhost';
    $dbuser = 'root';
    $dbpass = '';
    $dbname = 'thingstodo';

    //Tworzenie połączenia za bazą danych
    $dblink = new mysqli($dbhost, $dbuser, $dbpass, $dbname);

    //Sprawdzenie czy połaczenie zakończyło się sukcesem
    if ($dblink->connect_errno) {
        printf("Nie można połączyć się z bazą danych");
        exit();
    } else{
         $dblink->query("SET CHARACTER SET utf8");
    }

    // get the HTTP method, path and body of the request
    $method = $_SERVER['REQUEST_METHOD'];
    //echo "Method: ".$method ."; ";   
    if($method=='GET'){
        if(isset($_GET["request"])) {         
            $request = explode('/', $_GET["request"]);
            //echo "Request string: ".$_GET["request"]." --> " . "request: ".json_encode($request);
            if(isset($request[0]) && $request[0]==='todo'){
                $todo = $request[1];
                $recordId = 0;            
                if(isset($request[1]) && is_date($request[1]) ){
                    $dataZadania = $request[1];
                    //$dataZadania = '2020.02.26';
                    $zapytanie = "SELECT * FROM todo WHERE todo_data='".$dataZadania."' ORDER BY todo_nr";
                }
                else{
                    $zapytanie = "SELECT * FROM todo WHERE todo_data IS NULL ORDER BY todo_id";
                }
                getDataFromTable($zapytanie, $dblink);
            } else //{echo "Request string: ".$_GET["request"]." --> " . "request: ".json_encode($request);}
            
            if(isset($request[0]) && $request[0]==='delete'){  
                //echo var_dump($request);              
                $recordId = 0;            
                if(isset($request[1]) && is_numeric($request[1]) ){
                    $todo_id = $request[1];
                    $zapytanie = "DELETE FROM todo WHERE todo_id=".$todo_id;
                    usunZadanie($zapytanie, $dblink, $todo_id);                    
                }                
            }             
        }
    } 
    elseif ($method=='POST') {                 
         //echo $_POST["todo_zadanie"];         
         if(isset($_POST["todo_zadanie"])) { 
             $zadanie = $_POST["todo_zadanie"];
             $zadanie = htmlspecialchars($zadanie);
             $czas = date("Y-m-d H:i:s");
             $zapytanie = "INSERT INTO todo VALUES(null, null, '".$zadanie."', null, '".$czas."', 1)";
             wstawZadanie($zapytanie, $dblink, $zadanie);
            // echo '{"wynik": "'.$_POST["todo_zadanie"].'"}';            
        }elseif(isset($_POST["operacja"]) && ($_POST["operacja"]=='naDzien') && isset($_POST["todo_id"]) && isset($_POST["todo_data"])) {                 
            $todo_id = $_POST["todo_id"];
            $todo_data = $_POST["todo_data"];                
            //echo '{"todo_id":"'.$todo_id.'", "todo_data":"'.$todo_data.'"}';
            $zapytanie = "CALL DodajZadanieNaDzien('".$todo_data."',".$todo_id.")";                
            dodajZadanieNaDzien($zapytanie, $dblink, $todo_id);
            // echo '{"wynik": "'.$_POST["todo_zadanie"].'"}';            
        }elseif(isset($_POST["operacja"]) && ($_POST["operacja"]=='doWszystkie') && isset($_POST["todo_id"])) {                 
            $todo_id = $_POST["todo_id"];                          
            //echo '{"todo_id":"'.$todo_id.'", "todo_data":"'.$todo_data.'"}';
            $zapytanie = "UPDATE todo SET todo_nr=NULL, todo_data=NULL WHERE todo_id=".$todo_id;                
            dodajZadanieDoWszystkie($zapytanie, $dblink, $todo_id);
            // echo '{"wynik": "'.$_POST["todo_zadanie"].'"}';            
        }elseif(isset($_POST["operacja"]) && ($_POST["operacja"]=='zmienKolejnosc') && isset($_POST["todo_id"])&& isset($_POST["todo_nr"])) {                 
            $todo_id = $_POST["todo_id"]; 
            $todo_nr = $_POST["todo_nr"]; 
            //echo '{"todo_id":"'.$todo_id.'", "todo_data":"'.$todo_data.'"}';
            $zapytanie = "CALL ZmienKolejnoscZadania('".$todo_id."',".$todo_nr.")"; 
            zmienKolejnoscZadania($zapytanie, $dblink, $todo_id);
            // echo '{"wynik": "'.$_POST["todo_zadanie"].'"}';            
        }            
    }    

    function is_date($str){ 
        $str = str_replace('/', '-', $str);         
        $stamp = strtotime($str);        
        if (is_numeric($stamp)){  
        $month = date( 'm', $stamp ); 
        $day   = date( 'd', $stamp ); 
        $year  = date( 'Y', $stamp ); 
        return checkdate($month, $day, $year); 
        }  
        return false; 
    }
        

    function getDataFromTable($zapytanie, $dblink ){        
        //Wyniki zapytania znajdą się w zmiennej result
        $result = $dblink->query($zapytanie);
        //Tworzymy tablicę asocjacyjną z danymi
        $dbdata = array();
        $columns = array();

        //pobieramy nazwy kolumn i pierwszy wiersz
        $pierwszyRaz = true;
        //Zrzucamy dane do tablicy asocjacyjnej
        while ( $row = $result->fetch_assoc())  {
            if($pierwszyRaz){
                $columns = array_keys($row);
                $pierwszyRaz = false;
            }
            $dbdata[]=$row;            
        }
        
        //Zwracamy dane w postacji JSON
        echo '{"header":'.json_encode($columns) . ','.'"data":'.json_encode($dbdata).'}';   
    }
    function wstawZadanie($zapytanie, $dblink, $zadanie){
         $dblink->query($zapytanie);
         $todo_id = $dblink->insert_id;
         echo('{"todo_id":"'.$todo_id.'", "todo_zadanie":"'.$zadanie.'"}');
    }

    function usunZadanie($zapytanie, $dblink, $todo_id){
        $dblink->query($zapytanie);
        if($dblink->affected_rows==1){
            echo('{"todo_id":"'.$todo_id.'"}');
        }
    }

    function dodajZadanieNaDzien($zapytanie, $dblink, $todo_id){
        $dblink->query($zapytanie);
        if($dblink->affected_rows==1){
            echo('{"todo_id":"'.$todo_id.'"}');
        }
    }

    function dodajZadanieDoWszystkie($zapytanie, $dblink, $todo_id){
        $dblink->query($zapytanie);
        if($dblink->affected_rows==1){
            echo('{"todo_id":"'.$todo_id.'"}');
        }
    }

    function zmienKolejnoscZadania($zapytanie, $dblink, $todo_id){
        $dblink->query($zapytanie);
        if($dblink->affected_rows==1){
            echo('{"todo_id":"'.$todo_id.'"}');
        }
    } 
?>