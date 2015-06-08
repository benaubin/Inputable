var InputableInput = function(name,type,unprocessed,regex,input){
    //First, store user provided vars
    //Strings
    this.name = name
    this.type = type
    this.unprocessed = unprocessed
    //Regexs
    this.regex = regex
    //Functions
    this.input = input

    //Custom functions
    this.to_string = function(){this.name}
}

var InputableProccesor = function(name,type,input){
    //First, store user provided vars
    //Strings
    this.name = name
    this.type = type
    //Functions
    this.input = function(output){
        var out = input(output)
        if(!out.match){
            out.match = {matches: []}
            output.forEach(function(matches){
                matches = matches.match.matches
                if(out.match.matches[0])
                    out.match.matches[0] = out.match.matches[0] + ' + ' + matches.shift()
                else
                    out.match.matches[0] = matches.shift()
                out.match.matches = out.match.matches.concat(matches)
            })
        }
        out.type = type
        return out
    }
}

var InputableInputs = {
    lists: new InputableInput(
        'List',
        'list',
        false,
        new RegExp(/\S.*?,? (or|and) .+?\b/ig),
        function(match){
            return {
                object: match[0].replace(new RegExp(',? ' + match[1] + ' '), ', ').split(', '),
                match: {
                    matches: match
                }
            }
        }
    ),
    dates: {
        calenderNotation: new InputableInput(
            'American Calender Date',
            'date',
            true,
            new RegExp(/(1?\d)([\/.-])(\d{1,2})\2?(\d{2,4})?/ig),
            function(match){
                return {
                    object: {
                        month: parseInt(match[1]),
                        day: parseInt(match[3]),
                        year: parseInt((match[4])? ((match[4].length > 2)? match[4] : '20' + match[4]): moment().year())
                    },
                    match: {
                        matches: match
                    }
                }
            }
        ),
        time: new InputableInput(
            'HH:MM Time of 12H Day',
            'date',
            true,
            new RegExp(/([12]?\d):([0-5]\d) ?([AP]M)?/i),
            function(match){
                hour = parseInt(match[1])
                afternoon = moment().hour() > 11
                if(match[3] && match[3].toUpperCase() === 'PM' || !match[3] && afternoon)
                    hour += 12
                return {
                    object: {
                        hour: hour,
                        minute: parseInt(match[2])
                    },
                    match: {
                        matches: match,
                        readable: match.join(', ')
                    }
                }
            }
        ),
        hourTime: new InputableInput(
            'HH [PA]M Time of Day',
            'date',
            true,
            new RegExp(/([12]?\d) ?([AP]M)/ig),
            function(match){
                hour = parseInt(match[1])
                if(match[2].toUpperCase() === 'PM')
                    hour += 12
                return {
                    object: {
                        hour: hour
                    },
                    match: {
                        matches: match,
                        readable: match.join(', ')
                    }
                }
            }
        ),
        dayName: new InputableInput(
            'Name of a Day (fri, Monday, etc)',
            'date',
            true,
            new RegExp(/(sun|mon|tue|wed|thu|fri|sat)(?:[urnes]*?day)?\b/ig),
            function(match){
                var dates = ['sun','mon','tue','wed','thu','fri','sat']
                var day = dates.indexOf(match[0])
                if(day < moment().day())
                    day += 7
                var date = moment().day(day)
                return {
                    object: {
                        month: date.month(),
                        day: date.date(),
                        year: date.year()
                    }, 
                    match: {
                        matches: match,
                        fullMatch: match[0],
                        readable: match.join(', ')
                    }
                }
            }
        )
    },
    people: {

    },
    math: {

    }
}

var InputableProccesors = {
    date: new InputableProccesor(
        'Moment.JS Date',
        'date',
        function(output){
            var date = {
                object:{}
            }
            var hhmm = false
            output.forEach(function(output){
                for (var attr in output.object) { date.object[attr] = output.object[attr] }
            })
            
            date.moment = (moment)? moment(date.object) : 'Install the Moment.js Library for dates.'
            
            return date
        } 
    )
}

var Inputable = {
    inputs: [
        InputableInputs.lists,
        InputableInputs.dates.calenderNotation,InputableInputs.dates.hourTime,InputableInputs.dates.time,InputableInputs.dates.dayName],
    processors: [InputableProccesors.date],
    in: function(input){
        var output = []
        var unprocessedOutput = {}
        Inputable.inputs.forEach(function(Input, i){
            var match;
            var i = 0;
            while (match = Input.regex.exec(input)) {
                var result = Input.input(match)
                result.name = Input.name
                result.i = i
                
                var type = Input.type

                if(Input.unprocessed){
                    if(!unprocessedOutput[type])
                        unprocessedOutput[type] = []
                    unprocessedOutput[type].push(result)
                } else {
                    output.push(result)
                }
                i++;
            }
        })
        Inputable.processors.forEach(function(processor, i){
            input = unprocessedOutput[processor.type]
            if(input){
                var result = processor.input(input)
                result.name = processor.name
                result.input = input
                output.push(result)
            }
        })
        
        return (output.empty)? null : output
    }
}

