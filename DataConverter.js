


class DataConverter
{
    /**
     * function receives JSON object and converts the values (given as columns) to a csv format (as rows).
     * Returns an array with all rows as strings
     * @param data
     */
    static toCsvFormat(data) {
        let keys = Object.keys(data);
        let colums = [];
        let rows = [];
        rows.push(keys.toString());
        for (let key in data) {
            colums.push(data[key])
        }
        let length = colums[0].length;      // all columns are of same length
        for (let i =0; i < length; i++) {
            let tmp = ''
            for (let col of colums) {
                if (col === colums[colums.length-1]) {
                    tmp += col[i];
                    continue;
                }
                tmp +=  col[i] + ',';
            }
            rows.push(tmp);
        }
        return rows;

    }
}

module.exports = DataConverter;





