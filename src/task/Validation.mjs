class Validation {
    #config
    #validMethods


    constructor( { endpoints } ) {
        this.#config = { endpoints }
        this.#validMethods = Object.keys( this.#config.endpoints )
    }


    request( { route, params } ) {
        const m = []
        const s = []

        {
            const { messages, status } = this.#validateMethod( { route } )
            m.push( ...messages )
            s.push( status )
        }

        {
            const { messages, status } = this.#validateParams( { route, params } )
            m.push( ...messages )
            s.push( status )
        }

        const status = s.every( status => status === true )
        const result = { 'messages': m, status }

        return result
    }


    #validateMethod( { route } ) {
        const messages = []
        if( !route ) {
            messages.push( `route is undefined` )
        } else if( typeof route !== 'string' ) {
            messages.push( `route '${route}' is not a string.` )
        } else if( !this.#validMethods.includes( route ) ) {
            const suggestion = this.#findClosestString( { input: route, keys: this.#validMethods } )
            messages.push( `route '${route}' is unknown. Do you mean '${suggestion}'?` )
        }

        const status = messages.length === 0 ? true : false
        return { messages, status }
    }


    #validateParams( { route, params } ) {
        const messages = []
        if( !this.#validMethods.includes( route ) ) {
            return { 'messages': [], 'status': false }
        }

        const { inserts } = this.#config['endpoints'][ route ]
        if( params === undefined ) {
            messages.push( `Params is undefined` )
        } else if( typeof params !== 'object' ) {
            messages.push( `Params is not an object` )
        } else {
            const { body, query, inserts, validation } = this.#config['endpoints'][ route ]

            let validParams = []
            if( body ) { validParams = [ ...validParams, ...Object.entries( body ) ] }
            if( query ) { 
                validParams = [ ...validParams, ...Object.entries( query ) ] }
            if( inserts ) { validParams = [ ...validParams, ...inserts.map( key => [ key, true ] ) ] }

            validParams
                .forEach( ( [ key, required ] ) => {
                    if( !params[ key ] && required ) {
                        messages.push( `Missing parameter: ${key} (required)` )
                    }
                } )

            const validParamsKeys = validParams.map( ( [ key, ] ) => key )
            Object
                .keys( params )
                .forEach( key => {
                    if( !validParamsKeys.includes( key ) ) {
                        const suggestion = this.#findClosestString( { input: key, keys: validParamsKeys } )
                        messages.push( `Invalid parameter: ${key}. Did you mean '${suggestion}'?` )
                    }
                } )

            if( validation !== undefined ) {
                Object
                    .entries( validation )
                    .forEach( ( [ key, values ] ) => {
                        if( params[ key ] === undefined ) {
                            return false
                        }

                        if( !values.includes( params[ key ] ) ) {
                            messages.push( `Key '${key}:' Invalid value for parameter: ${key}. Choose from ${values.join(',')} instead.` )
                        }
                    } )
            }
        }

        const status = messages.length === 0 ? true : false
        return { messages, status }
    }


    #findClosestString( { input, keys } ) {
        function distance( a, b ) {
            let dp = Array( a.length + 1 )
                    .fill( null )
                    .map( () => Array( b.length + 1 )
                    .fill( 0 )
                )
                .map( ( z, index, all ) => {
                    index === 0 ? z = z.map( ( y, rindex ) => rindex ) : ''
                    z[ 0 ] = index 
                    return z
                } )
    
            dp = dp
                .map( ( z, i ) => {
                    return z.map( ( y, j ) => {
                        if( i > 0 && j > 0 ) {
                            if( a[ i - 1 ] === b[ j - 1 ] ) {
                                y = dp[ i - 1 ][ j - 1 ]
                            } else {
                                const min = Math.min(
                                    dp[ i - 1 ][ j ], 
                                    dp[ i ][ j - 1 ], 
                                    dp[ i - 1 ][ j - 1 ]
                                )
                                y = 1 + min
                            }
                        }
                        return y
                    } )
                } )
    
            return dp[ a.length ][ b.length ]
        }
    
    
        const result = keys
            .reduce( ( acc, key, index ) => {
                const currentDistance = distance( input, key )
                if( index === 0 ) {
                    acc = {
                        'closestKey': key,
                        'closestDistance': currentDistance
                    }
                }
                
                if( currentDistance < acc['closestDistance'] ) {
                    acc['closestKey'] = key;
                    acc['closestDistance'] = currentDistance;
                }
    
                return acc
            }, {} )
    
        return result['closestKey']
    }
}


export { Validation}