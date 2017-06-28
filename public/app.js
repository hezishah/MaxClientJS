$(function(){ // called when window is loaded

    /** GLOBAL SETUP **/

    paper.install(window); // access paper.js namespace
    var tool = new Tool(); // create paper.js event tool
    paper.setup('drawCanvas'); // set canvas for paper.js

    var paths = new Array(); // path collection for user paths
    var userId; // user id of this user
    var sendNote = false; // send note flag for use in event listener
    var instrument = "Pad"; // current selected instrument
    var receive = false;

    // create an maxCommunication object in order to send and receive msgs
    var maxCommunicator = new MaxCommunication.getInstance({
                            'udpPort' : 50000
                        });

    // params to control the instruments in Ableton
    var instrumentParams = {
        "Wurli" : {
            "volume" : 85,
            "panning" : 0,
            "send0" : 0,
            "send1" : 0,
            "send2" : 0
        },
        "Drums" : {
            "volume" : 85,
            "panning" : 0,
            "send0" : 0,
            "send1" : 0,
            "send2" : 0
        },
        "Pad" : {
            "volume" : 85,
            "panning" : 0,
            "send0" : 0,
            "send1" : 0,
            "send2" : 0
        },
        "Pad2" : {
            "volume" : 85,
            "panning" : 0,
            "send0" : 0,
            "send1" : 0,
            "send2" : 0
        }

    };

    /////////////////////////
    /** INITIALIZE KNOBS **/

    $("#volume").knob({ // volume knob
        // UI elements
        'width':    100
        ,'fgColor':   "#3786A8"
        ,'bgColor':   "#3F5765" 

        // default settings
        ,"max":     100
        ,"min":     0

        // Listener
        ,'change'   :   function(val){
                            if(!receive){
                                instrumentParams[instrument]["volume"] = val;
                                maxCommunicator.sendMsgToMax("volume",['s','i'],[instrument,val]);
                                maxCommunicator.sendMsgToServer('paramChanged',
                                    {"instrument" : instrument, "parameter" : "volume", "value" : val});
                            }
                        ;}
    });

    $("#duration").knob({ // midi note duration knob
        // UI elements
        'width':    100
        ,'fgColor':   "#3786A8"
        ,'bgColor':   "#3F5765" 

        // default settings
        ,"max":     1000
        ,"min":     0

        // Listener
        ,'change'   :   function(val){
                            maxCommunicator.sendIntsToMax("duration",[userId,val]);
                        ;}
    });

    $("#panning").knob({ // pan knob
        // UI elements
        'width':    100
        ,'fgColor':   "#3786A8"
        ,'bgColor':   "#3F5765" 
        ,'cursor': 'cursor'

        // default settings
        ,"max":     100
        ,"min":     -100
        ,"angleOffset": 3.14

        // Listener
        ,'change'   :   function(val){
                            if(!receive){
                                instrumentParams[instrument]["panning"] = val;
                                maxCommunicator.sendMsgToMax("panning",['s','i'],[instrument,val]);
                                maxCommunicator.sendMsgToServer('paramChanged',
                                    {"instrument" : instrument, "parameter" : "panning", "value" : val});
                            }
                        ;}
    });

    $("#send0").knob({ // temp knob
        // UI elements
        'width':    100
        ,'fgColor':   "#3786A8"
        ,'bgColor':   "#3F5765" 

        // default settings
        ,"max":     80
        ,"min":     0

        // Listener
        ,'change'   :   function(val){
                            if(!receive){
                                instrumentParams[instrument]["send0"] = val;
                                maxCommunicator.sendMsgToMax("send0",['s','i'],[instrument,val]);
                                maxCommunicator.sendMsgToServer('paramChanged',
                                    {"instrument" : instrument, "parameter" : "send0", "value" : val});
                            }
                        ;}
    });

    $("#send1").knob({ // temp knob
        // UI elements
        'width':    100
        ,'fgColor':   "#3786A8"
        ,'bgColor':   "#3F5765" 

        // default settings
        ,"max":     100
        ,"min":     0

        // Listener
        ,'change'   :   function(val){
                            if(!receive){
                                instrumentParams[instrument]["send1"] = val;
                                maxCommunicator.sendMsgToMax("send1",['s','i'],[instrument,val]);
                                maxCommunicator.sendMsgToServer('paramChanged',
                                    {"instrument" : instrument, "parameter" : "send1", "value" : val});
                            }
                        ;}
    });

    $("#send2").knob({ // temp knob
        // UI elements
        'width':    100
        ,'fgColor':   "#3786A8"
        ,'bgColor':   "#3F5765" 

        // default settings
        ,"max":     100
        ,"min":     0

        // Listener
        ,'change'   :   function(val){
                            if(!receive){
                                instrumentParams[instrument]["send2"] = val;
                                maxCommunicator.sendMsgToMax("send2",['s','i'],[instrument,val]);
                                maxCommunicator.sendMsgToServer('paramChanged',
                                    {"instrument" : instrument, "parameter" : "send2", "value" : val});
                            }
                        ;}
    });

    /////////////////////////////////////////////////
    /* ----- COMMUNICATION WITH SERVER ONLY ----- */

    maxCommunicator.receiveMsgFromServer("userId",function(data){
        userId = data;
        console.log("userid set to: " + userId);
        createNewPath(userId,"#8A735F");
    });

    maxCommunicator.receiveMsgFromServer("userDB",function(data){
        for(var i = 0; i < data.length;i++){
            if(data[i] != null && i != userId){
                createNewPath(i,data[i].color);
            }
        }
    });

    maxCommunicator.receiveMsgFromServer("image",function(data){
        $("#image").attr('src','data:image/jpg;base64,'+data);
    });

    maxCommunicator.receiveMsgFromServer("newUser",function(data){
        createNewPath(data,"#8A735F");
    });

    maxCommunicator.receiveMsgFromServer("draw",function(data){
        drawPath(data.userId,data.x,data.y);
    });

    maxCommunicator.receiveMsgFromServer("changeColor",function(data){
        changePathColor(data.userId,data.color);
    });

    maxCommunicator.receiveMsgFromServer("remove",function(data){
        paths[data].remove();
    });

    maxCommunicator.receiveMsgFromServer('paramChanged',function(data){
        instrumentParams[data.instrument][data.parameter] = data.value;
        if(data.instrument == instrument){
            updateKnob(data.parameter);
        }
    });

    maxCommunicator.receiveMsgFromServer('clip',function(data){
        triggerClip(data,false);
    });

    maxCommunicator.receiveMsgFromServer('drumHit',function(data){
        markDrumPad(data.drum,data.userId)
    });

    maxCommunicator.receiveMsgFromServer('drumRelease',function(data){
        unmarkDrumPad(data);
    });

    maxCommunicator.receiveMsgFromServer('setInstrumentParams',function(data){
        instrumentParams = data;
        updateKnobs();
    });
    
    ///////////////////////////////////////////
    /* ----- MESSAGES FROM MAX ----- */

    maxCommunicator.addMaxMsgHandler('mastermeter',function(flags,values){
        drawVolume(values[0] / 2);
    });

    /* ------ HELPER METHODS ----- */

    // params

    function updateKnobs(){
        updateKnob("volume");
        updateKnob("panning");
        updateKnob("send0");
        updateKnob("send1");
        updateKnob("send2");
    }

    function updateKnob(id,val){
        receive = true;
        $("#" + id).val(instrumentParams[instrument][id]).trigger('change');
        receive = false;
    }

    // node sending

    function sendNoteToMax(ins,pitc,veloc){
        maxCommunicator.sendMsgToMax('note',['s','i','i','i'],[ins,userId,pitc,veloc]);
    }

    // path drawing

    var size = 10;

    function createNewPath(index,color){
        var start = new Point(50,50);
        paths[index] = new Path();
        paths[index].strokeColor = color;
        paths[index].strokeWidth = 20;
        paths[index].strokeCap = 'round';

        for(var i = 0; i <size;i++){
            paths[index].add(start.add([i*10,0]));
        }
    }

    function drawPath(index,x,y){
        var segments = paths[index].segments;
        segments[0].point = new Point(x,y);
        for (var i = 0; i < size - 1; i++) {
            var nextSegment = segments[i + 1];
            var position = paths[index].segments[i].point;
            var angle = (position.add([-nextSegment.point.x,-nextSegment.point.y])).angle;
            var vector = new Point({ angle: angle, length: 35 });
            nextSegment.point.x = position.x - vector.x;
            nextSegment.point.y = position.y - vector.y;
        }
        paths[index].smooth();
    }

    function changePathColor(index,color){
        paths[index].strokeColor = color;
    }

    function pathMoved(x,y,click){
        if(x < 590 && y < 580 && y > 0){

                drawPath(userId,x,y);
                maxCommunicator.sendMsgToServer("draw",{"userId" : userId, "x" : x, "y" : y});

                var tempPitch = mapPitch(x);
                var tempVelo = mapVelocity(y);

                if(click){
                    sendNoteToMax(instrument,tempPitch,tempVelo); 
                }else{
                    if(isNewNote(tempPitch,tempVelo)){
                        sendNoteToMax(instrument,tempPitch,tempVelo); 
                    }
                }
            }
    }


    // volume drawing

    // at first instantiate volume meter
    var defaultC =  $("body").css('background-color');
    var volBorder = new Path.Rectangle([600,5],[30,510]);
    volBorder.strokeWidth = 5;
    volBorder.strokeColor = "white";

    var volLeft = new Array();
    var volRight =  new Array();

    for(var i = 50; i >= 0; i--){
        volLeft[50 - i] = new Path.Rectangle([600,5 + i*10],[15,10]);
        volRight[50 - i] = new Path.Rectangle([615,5 + i*10],[15,10]);

        volRight[50 - i].fillColor = defaultC;
        volLeft[50 - i].fillColor = defaultC;
        volRight[50 - i].strokeColor = defaultC;
        volLeft[50 - i].strokeColor = defaultC;
    }

    var volumeColors = ['#5D8C2E','#5D8C2E','#5D8C2E','#5D8C2E','#5D8C2E','#647E29','#647E29',
                        '#647E29','#79541B','#A50000'];

    function drawVolume(vol){
        var colIndex = 0;
        for(var i = 0; i <= vol; i++){
            colIndex = Math.floor(i/5);
            volLeft[i].fillColor = volumeColors[colIndex];
            volRight[i].fillColor = volumeColors[colIndex];
        }
        for(var i = 50; i> vol; i--){
            volLeft[i].fillColor = defaultC;
            volRight[i].fillColor = defaultC;
        }
    }

    // clip triggering

    function triggerClip(clipVal,sendFlag){
        $(".clip").css("background-color","#195073");
        $("#clip" + clipVal).css("background-color","red");

        if(sendFlag){
            maxCommunicator.sendMsgToMax("clip",["i"],clipVal);
            maxCommunicator.sendMsgToServer("clip",clipVal);
        }
    }

    // drumpads

    function playDrum(id,drumVal){
        markDrumPad(id,userId);
        sendNoteToMax("Drums",drumVal,100);
        maxCommunicator.sendMsgToServer("drumHit",{"drum" : id, "userId" : userId});
    }

    function releaseDrum(id){
        unmarkDrumPad(id);
        maxCommunicator.sendMsgToServer("drumRelease",id);
    }

    function markDrumPad(id,user){
        $("#" + id).css('background',paths[user].strokeColor._cssString);

    }

    function unmarkDrumPad(id){
        $("#" + id).css('background',"grey");
    }


    /** MIDI NOTE HANDLING **/

    var minPitch = 36;
    var pitchScaleFactor = 91. / 600.;

    function mapPitch(value){
        return Math.round(minPitch + value * pitchScaleFactor);
    }

    var veloScaleFactor = 127. / 580.;
    function mapVelocity(value){
        return Math.round(value * veloScaleFactor);
    }

    var oldPitch, oldVelocity;
    function isNewNote(pitch,velocity){
        var result = (pitch != oldPitch || velocity != oldVelocity) ? true : false;
        oldPitch = pitch;
        oldVelocity = velocity;

        return result;
    }


    /** EVENT LISTENER **/

    // CANVAS LISTENER
    tool.onMouseMove = function(evt){
        if(sendNote){
            pathMoved(evt.point.x,evt.point.y,false);
        }
    };

    tool.onMouseDown = function(evt){
        sendNote = true;
        pathMoved(evt.point.x,evt.point.y,true);
    };

    tool.onMouseUp = function(evt){
        sendNote = false;
    }


    // CLIP TRIGGER LISTENER
    $(".clip").click(function(){
        triggerClip($(this).attr("clip-value"),true);
    });

    // COLORBOXES LISTENER
    $(".colorChooser").click(function(){
        var color = $(this).attr("data-colour");
        paths[userId].strokeColor = color
        maxCommunicator.sendMsgToServer("changeColor",{"userId" : userId,"color" : color});
    });

    // INSTRUMENT MENU LISTENER
    $("#instrument").change(function(evt){              
        var selected = $("#instrument").val();
        if(selected == "vid"){ // check if vid was selected in order to disable playback and show the animation
            $('#overlay').fadeIn('fast',function(){
                $('#box').animate({'top':'100px'},500);
            });
        } else{
            instrument = selected;
            updateKnobs();
        }
    });

    // DRUMPAD LISTENER

    $(".drumPad").mousedown(function(){
        playDrum($(this).attr('id'),$(this).attr('drumValue'));
    });
    $(".drumPad").mouseup(function(){
        releaseDrum($(this).attr('id'));
    });

    // WINDOW KEYLISTENER
    window.onkeydown = function(evt){
        if(evt.keyCode == 49){
            playDrum("drum35",35);
        } else if(evt.keyCode == 50){
            playDrum("drum36",36);
        } else if(evt.keyCode == 51){
            playDrum("drum38",38);
        } else if(evt.keyCode == 52){
            playDrum("drum40",40);
        } else if(evt.keyCode == 53){
            playDrum("drum44",44);
        } else if(evt.keyCode == 54){
            playDrum("drum46",46);
        } else if(evt.keyCode == 55){
            playDrum("drum37",37);
        }else if(evt.keyCode == 56){
            playDrum("drum39",39);
        }else if(evt.keyCode == 57){
            playDrum("drum51",51);
        }
    };

    window.onkeyup = function(evt){
        if(evt.keyCode == 49){
            releaseDrum("drum35");
        } else if(evt.keyCode == 50){
            releaseDrum("drum36");
        } else if(evt.keyCode == 51){
            releaseDrum("drum38");
        } else if(evt.keyCode == 52){
            releaseDrum("drum40");
        } else if(evt.keyCode == 53){
            releaseDrum("drum44");
        } else if(evt.keyCode == 54){
            releaseDrum("drum46");
        } else if(evt.keyCode == 55){
            releaseDrum("drum37");
        }else if(evt.keyCode == 56){
            releaseDrum("drum39");
        }else if(evt.keyCode == 57){
            releaseDrum("drum51");
        }
    };

    $('#boxclose').click(function(){
        $('#box').animate({'top':'-500px'},500,function(){
            $('#overlay').fadeOut('fast');
        });
        $("#instrument").val('Theremin');
    });

    // PAPER.JS on frame draw method
    view.onFrame = function(event){
    };
});