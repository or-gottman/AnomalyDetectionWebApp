



class DataConverter
{
    /**
     * function receives JSON object and converts the values (given as columns) to a csv format (as rows).
     * Returns an array with all rows as strings
     * @param data
     */
    static convert(data) {
        let keys = Object.keys(data);
        let colums = [];
        let rows = [];
        rows.push(keys.toString());
        for (let key in data) {

            colums.push(data[key])
        }
        let length = colums.length;
        for (let i =0; i < length; i++) {
            let tmp = []
            for (let col of colums) {
                tmp.push(col[i]);
            }
            rows.push(tmp.toString());
        }
        return rows;

    }
}



module.exports = DataConverter;





